import { PrismaClient } from "@prisma/client";
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
const anyScore = { OR: FIELDS.map((f) => ({ [f]: { not: null } })) };

const unlinked = { schoolSubjectId: null };
const total = await prisma.subject.count({ where: unlinked });
const noTerm = await prisma.subject.count({
  where: { ...unlinked, termId: null },
});
const noTermWithScores = await prisma.subject.count({
  where: { ...unlinked, termId: null, ...anyScore },
});
const hasTerm = await prisma.subject.count({
  where: { ...unlinked, termId: { not: null } },
});

console.log({ total, noTerm, noTermWithScores, hasTerm });
await prisma.$disconnect();
