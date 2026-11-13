import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const INCLUDE_SCORED = process.argv.includes("--include-scored");

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
const empty = Object.fromEntries(FIELDS.map((f) => [f, null]));
const where = {
  schoolSubjectId: null,
  termId: null,
  ...(INCLUDE_SCORED ? {} : empty),
};

const n = await prisma.subject.count({ where });
console.log(
  `${APPLY ? "DELETING" : "DRY RUN:"} ${n} orphan rows` +
    (INCLUDE_SCORED ? " (including rows with scores)" : " (empty only)"),
);
if (APPLY) {
  const r = await prisma.subject.deleteMany({ where });
  console.log(`Deleted ${r.count}`);
}
await prisma.$disconnect();
