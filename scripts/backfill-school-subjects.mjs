// scripts/backfill-school-subjects.mjs

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const CREATE_ORPHANS = argv.includes("--create-orphans");
const VERIFY = argv.includes("--verify");
const MAP_FILE = (
  argv.find((a) => a.startsWith("--map=")) ||
  "--map=scripts/subject-name-map.json"
).slice("--map=".length);
const REPORT_FILE = "scripts/backfill-report.json";
const CHUNK = 1000;

const clean = (s) =>
  String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");
const norm = (s) => clean(s).toLowerCase();

const loadMap = () => {
  if (!fs.existsSync(MAP_FILE)) return {};
  return JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
};

async function processSchool(school, MAP, report) {
  // alias (normalised old name) -> canonical display name
  const aliases = new Map(
    Object.entries(MAP[String(school.id)] || {}).map(([from, to]) => [
      norm(from),
      clean(to),
    ]),
  );
  const resolve = (raw) => {
    const n = norm(raw);
    const canonical = aliases.get(n);
    return canonical
      ? { key: norm(canonical), display: canonical }
      : { key: n, display: clean(raw) };
  };

  const stats = (report.schools[school.id] = {
    name: school.name,
    created: [],
    linkedExact: 0,
    linkedRenamed: 0,
    conflicts: [],
    orphanSubjectRows: {},
    teachers: { connected: 0, unresolved: [] },
  });

  const existing = await prisma.schoolSubject.findMany({
    where: { schoolId: school.id },
  });
  const byKey = new Map(existing.map((s) => [norm(s.name), s]));

  const ensure = async (key, display, reason) => {
    if (byKey.has(key)) return byKey.get(key);
    const entry = { id: null, name: display };
    if (APPLY) {
      const created = await prisma.schoolSubject.create({
        data: { schoolId: school.id, name: display },
      });
      entry.id = created.id;
    }
    stats.created.push({ name: display, reason });
    byKey.set(key, entry);
    return entry;
  };

  // 1) the school's own subject list
  for (const name of school.subjects || []) {
    if (!clean(name)) continue;
    const { key, display } = resolve(name);
    await ensure(key, display, "from school subject list");
  }

  // 2) student score rows that are not linked yet
  const rows = await prisma.subject.findMany({
    where: {
      schoolSubjectId: null,
      term: { student: { schoolId: school.id } },
    },
    select: { id: true, subjectName: true, termId: true },
  });

  const groups = new Map();
  for (const r of rows) {
    const { key, display } = resolve(r.subjectName);
    if (!groups.has(key)) groups.set(key, { display, rows: [] });
    groups.get(key).rows.push(r);
  }

  for (const [key, group] of groups) {
    let target = byKey.get(key);
    if (!target) {
      if (!CREATE_ORPHANS) {
        stats.orphanSubjectRows[group.display] = group.rows.length;
        continue;
      }
      target = await ensure(
        key,
        group.display,
        "orphan (on student records, not in school list)",
      );
    }

    // terms that already have a row linked to this subject
    const claimed = new Set();
    if (target.id) {
      const linked = await prisma.subject.findMany({
        where: { schoolSubjectId: target.id },
        select: { termId: true },
      });
      linked.forEach((l) => claimed.add(l.termId));
    }

    const exact = [];
    const renamed = [];
    for (const r of group.rows) {
      (r.subjectName === target.name ? exact : renamed).push(r);
    }
    exact.forEach((r) => claimed.add(r.termId));

    if (APPLY && target.id) {
      for (let i = 0; i < exact.length; i += CHUNK) {
        await prisma.subject.updateMany({
          where: { id: { in: exact.slice(i, i + CHUNK).map((r) => r.id) } },
          data: { schoolSubjectId: target.id },
        });
      }
    }
    stats.linkedExact += exact.length;

    for (const r of renamed) {
      // The student already has a row for the current name in this term:
      // two score rows would collide, so a human has to decide.
      if (claimed.has(r.termId)) {
        stats.conflicts.push({
          subjectRowId: r.id,
          termId: r.termId,
          from: r.subjectName,
          to: target.name,
        });
        continue;
      }
      claimed.add(r.termId);
      if (APPLY && target.id) {
        await prisma.subject.update({
          where: { id: r.id },
          data: { schoolSubjectId: target.id, subjectName: target.name },
        });
      }
      stats.linkedRenamed++;
    }
  }

  // 3) teachers (additive only: never removes an assignment)
  const users = await prisma.user.findMany({
    where: { schoolId: school.id },
    select: {
      id: true,
      username: true,
      subjects: true,
      assignedSubjects: { select: { id: true } },
    },
  });

  for (const u of users) {
    const toConnect = [];
    for (const name of u.subjects || []) {
      if (!clean(name)) continue;
      const { key, display } = resolve(name);
      let target = byKey.get(key);
      if (!target && CREATE_ORPHANS) {
        target = await ensure(
          key,
          display,
          "orphan (on teacher, not in school list)",
        );
      }
      if (!target) {
        stats.teachers.unresolved.push({
          userId: u.id,
          username: u.username,
          name,
        });
        continue;
      }
      const already =
        target.id && u.assignedSubjects.some((a) => a.id === target.id);
      if (!already && !toConnect.includes(target)) toConnect.push(target);
    }
    stats.teachers.connected += toConnect.length;
    const ids = toConnect.map((t) => t.id).filter(Boolean);
    if (APPLY && ids.length) {
      await prisma.user.update({
        where: { id: u.id },
        data: { assignedSubjects: { connect: ids.map((id) => ({ id })) } },
      });
    }
  }
}

async function backfill() {
  const MAP = loadMap();
  const report = {
    mode: APPLY ? "APPLY" : "DRY RUN",
    createOrphans: CREATE_ORPHANS,
    schools: {},
  };
  const schools = await prisma.school.findMany({
    select: { id: true, name: true, subjects: true },
  });

  for (const school of schools) {
    await processSchool(school, MAP, report);
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log(`\n=== ${report.mode} ===`);
  let needsAttention = false;
  for (const [id, s] of Object.entries(report.schools)) {
    const orphans = Object.keys(s.orphanSubjectRows).length;
    console.log(
      `\nSchool ${id} (${s.name}): +${s.created.length} subjects, ` +
        `${s.linkedExact} rows linked, ${s.linkedRenamed} linked+renamed, ` +
        `${s.teachers.connected} teacher links`,
    );
    if (orphans) {
      needsAttention = true;
      console.log(
        `  ! ${orphans} names on student records are NOT in the school list:`,
      );
      for (const [name, n] of Object.entries(s.orphanSubjectRows)) {
        console.log(`      "${name}" (${n} rows)`);
      }
    }
    if (s.conflicts.length) {
      needsAttention = true;
      console.log(
        `  ! ${s.conflicts.length} conflicts (a student has both old and new name in one term)`,
      );
    }
    if (s.teachers.unresolved.length) {
      needsAttention = true;
      console.log(
        `  ! ${s.teachers.unresolved.length} teacher subjects could not be matched`,
      );
    }
  }
  console.log(`\nFull report written to ${REPORT_FILE}`);
  if (needsAttention) {
    console.log(
      "Fix the '!' items by adding them to the map file (old name -> current name) " +
        "or by re-running with --create-orphans, then run again.",
    );
  }
  if (!APPLY)
    console.log(
      "\nThis was a dry run. Nothing was written. Add --apply to write.",
    );
}

async function verify() {
  const unlinked = await prisma.subject.count({
    where: { schoolSubjectId: null },
  });
  const stale = await prisma.$queryRaw`
    SELECT count(*)::int AS n
    FROM "Subject" s JOIN "SchoolSubject" ss ON ss.id = s."schoolSubjectId"
    WHERE s."subjectName" <> ss."name"`;

  const users = await prisma.user.findMany({
    where: { subjects: { isEmpty: false } },
    select: {
      id: true,
      username: true,
      subjects: true,
      assignedSubjects: { select: { id: true } },
    },
  });
  const mismatched = users.filter(
    (u) => u.subjects.length !== u.assignedSubjects.length,
  );

  console.log(
    `Unlinked score rows (must be 0 before the contract step): ${unlinked}`,
  );
  console.log(
    `Score rows whose old name copy differs from the subject name: ${stale[0].n}`,
  );
  console.log(
    `Teachers whose old list and new links differ in size: ${mismatched.length}`,
  );
  mismatched
    .slice(0, 20)
    .forEach((u) =>
      console.log(
        `   user ${u.id} (${u.username}): old=${u.subjects.length} new=${u.assignedSubjects.length}`,
      ),
    );
  if (unlinked > 0 || mismatched.length > 0) process.exitCode = 1;
}

(VERIFY ? verify() : backfill())
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
