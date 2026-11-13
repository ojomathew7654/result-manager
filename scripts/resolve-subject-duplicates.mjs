// scripts/resolve-subject-duplicates.mjs
//
// Fixes the "conflicts" from the backfill: a student who has TWO score rows for
// the same subject in the same term (e.g. "C.R.S" and "C. R. S", or "ENGLISH" and
// "English"), usually because one is an empty row left by "add subject to class".
//
//   node scripts/resolve-subject-duplicates.mjs            -> DRY RUN (writes nothing)
//   node scripts/resolve-subject-duplicates.mjs --apply    -> deletes the empty duplicates
//
// Rules (a row is "empty" only when ALL 12 score fields are null):
//   - exactly one row has values  -> keep it, delete the empty ones
//   - no row has values           -> keep the oldest row, delete the others
//   - two or more rows have values -> SKIP, delete nothing, list it for a human
// A row that contains any score is never deleted.
//
// It uses the same map file as the backfill, so names that the map treats as the
// same subject are grouped together. Run it BEFORE the backfill --apply.

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const MAP_FILE = (
  argv.find((a) => a.startsWith("--map=")) || "--map=scripts/subject-name-map.json"
).slice("--map=".length);
const REPORT_FILE = "scripts/resolve-report.json";
const CHUNK = 1000;

const FIELDS = [
  "firstCA", "secondCA", "thirdCA", "fourthCA", "fifthCA", "sixthCA",
  "assignment", "project", "note", "rt", "affective", "exam",
];
const clean = (s) => String(s ?? "").trim().replace(/\s+/g, " ");
const norm = (s) => clean(s).toLowerCase();
const hasValues = (r) => FIELDS.some((f) => r[f] !== null && r[f] !== undefined);
const scoresOf = (r) =>
  Object.fromEntries(FIELDS.filter((f) => r[f] != null).map((f) => [f, r[f]]));

const MAP = fs.existsSync(MAP_FILE)
  ? JSON.parse(fs.readFileSync(MAP_FILE, "utf8"))
  : {};

async function main() {
  const schools = await prisma.school.findMany({ select: { id: true, name: true } });
  const report = { mode: APPLY ? "APPLY" : "DRY RUN", schools: {}, skipped: [] };
  let blocked = 0;

  for (const school of schools) {
    const aliases = new Map(
      Object.entries(MAP[String(school.id)] || {}).map(([from, to]) => [norm(from), norm(to)])
    );
    const keyOf = (name) => {
      const n = norm(name);
      return aliases.get(n) ?? n;
    };

    const rows = await prisma.subject.findMany({
      where: { schoolSubjectId: null, term: { student: { schoolId: school.id } } },
    });

    const groups = new Map();
    for (const r of rows) {
      const k = `${r.termId}|${keyOf(r.subjectName)}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }

    const toDelete = [];
    let duplicateGroups = 0;
    let keptWithValues = 0;
    let keptAllEmpty = 0;
    let skipped = 0;

    for (const group of groups.values()) {
      if (group.length < 2) continue;
      duplicateGroups++;

      const withValues = group.filter(hasValues);
      if (withValues.length > 1) {
        skipped++;
        report.skipped.push({
          schoolId: school.id,
          termId: group[0].termId,
          rows: group.map((r) => ({ id: r.id, name: r.subjectName, scores: scoresOf(r) })),
        });
        continue;
      }

      const keep = withValues[0] ?? [...group].sort((a, b) => a.id - b.id)[0];
      if (withValues[0]) keptWithValues++;
      else keptAllEmpty++;

      for (const r of group) {
        if (r.id === keep.id) continue;
        // safety net: never delete a row that has any value
        if (hasValues(r)) throw new Error(`Refusing to delete row ${r.id}: it has values`);
        toDelete.push(r.id);
      }
    }

    blocked += skipped;
    report.schools[school.id] = {
      name: school.name,
      duplicateGroups,
      keptRowWithValues: keptWithValues,
      keptOldestOfAllEmpty: keptAllEmpty,
      skippedNeedHuman: skipped,
      emptyRowsToDelete: toDelete.length,
    };

    if (APPLY) {
      for (let i = 0; i < toDelete.length; i += CHUNK) {
        await prisma.subject.deleteMany({
          where: {
            id: { in: toDelete.slice(i, i + CHUNK) },
            // double safety: only rows that are still completely empty
            ...Object.fromEntries(FIELDS.map((f) => [f, null])),
          },
        });
      }
    }
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n=== ${report.mode} ===`);
  console.table(report.schools);
  console.log(`Report written to ${REPORT_FILE}`);
  if (blocked > 0) {
    console.log(`\n! ${blocked} duplicate groups have scores in BOTH rows. Nothing was deleted for those; see ${REPORT_FILE}.`);
    process.exitCode = 1;
  }
  if (!APPLY) console.log("\nDry run only. Add --apply to delete the empty duplicates.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
