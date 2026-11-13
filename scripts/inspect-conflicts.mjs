// scripts/inspect-conflicts.mjs
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const FIELDS = [
  "firstCA",
  "secondCA",
  "thirdCA",
  "fourthCA",
  "fifthCA",
  "sixthCA",
  "assignment",
  "project",
  "note",
  "rt",
  "affective",
  "exam",
];
const norm = (s) =>
  String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
const filled = (r) => FIELDS.filter((f) => r[f] != null).length;
const scoresOf = (r) =>
  Object.fromEntries(FIELDS.filter((f) => r[f] != null).map((f) => [f, r[f]]));

const report = JSON.parse(
  fs.readFileSync("scripts/backfill-report.json", "utf8"),
);

async function main() {
  for (const [schoolId, s] of Object.entries(report.schools)) {
    if (!s.conflicts.length) continue;
    const termIds = [...new Set(s.conflicts.map((c) => c.termId))];
    const rows = await prisma.subject.findMany({
      where: { termId: { in: termIds } },
    });

    const tally = {
      oneRowEmpty: 0,
      bothEmpty: 0,
      identical: 0,
      bothHaveDifferentScores: 0,
      other: 0,
    };
    const examples = [];

    for (const c of s.conflicts) {
      const pair = rows.filter(
        (r) => r.termId === c.termId && norm(r.subjectName) === norm(c.to),
      );
      if (pair.length !== 2) {
        tally.other++;
        continue;
      }
      const [a, b] = pair;
      const fa = filled(a),
        fb = filled(b);
      if (fa === 0 && fb === 0) tally.bothEmpty++;
      else if (fa === 0 || fb === 0) tally.oneRowEmpty++;
      else if (JSON.stringify(scoresOf(a)) === JSON.stringify(scoresOf(b)))
        tally.identical++;
      else {
        tally.bothHaveDifferentScores++;
        if (examples.length < 5)
          examples.push({
            termId: c.termId,
            a: { id: a.id, name: a.subjectName, scores: scoresOf(a) },
            b: { id: b.id, name: b.subjectName, scores: scoresOf(b) },
          });
      }
    }

    console.log(
      `\nSchool ${schoolId} (${s.name}): ${s.conflicts.length} conflicts`,
    );
    console.table(tally);
    if (examples.length) console.log(JSON.stringify(examples, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
