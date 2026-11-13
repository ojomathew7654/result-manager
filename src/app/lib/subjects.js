// src/lib/subjects.js
// Shared helpers for the subject-id migration.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const cleanName = (s) =>
  String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");

// Use this `include` in any query that returns students' terms/subjects.
export const subjectInclude = {
  schoolSubject: { select: { id: true, name: true } },
};

// Makes every score row carry `subjectId` and the CURRENT `subjectName`
// (taken from SchoolSubject), so pages that still read `subjectName`
// (report cards etc.) keep working and always show the up-to-date name.
// Expects students loaded with: terms: { include: { subjects: { include: subjectInclude } } }
export function withSubjectNames(students) {
  return students.map((student) => ({
    ...student,
    terms: (student.terms || []).map((term) => ({
      ...term,
      subjects: (term.subjects || []).map(({ schoolSubject, ...subject }) => ({
        ...subject,
        subjectId: subject.schoolSubjectId ?? null,
        subjectName: schoolSubject?.name ?? subject.subjectName,
      })),
    })),
  }));
}

// ---------------------------------------------------------------------
// LEGACY SYNC (transition period only)
// While the old text columns still exist, we keep them in step so that a
// rollback to the old code is safe. Delete these in the contract step.
// `tx` is a Prisma client or transaction client.
// ---------------------------------------------------------------------
export async function legacyAddToSchool(tx, schoolId, name) {
  await tx.$executeRaw`
    UPDATE "School"
    SET "subjects" = array_append("subjects", ${name}::text)
    WHERE "id" = ${schoolId} AND NOT (${name}::text = ANY("subjects"))`;
}

export async function legacyRename(tx, schoolId, oldName, newName) {
  await tx.$executeRaw`
    UPDATE "School"
    SET "subjects" = array_replace("subjects", ${oldName}::text, ${newName}::text)
    WHERE "id" = ${schoolId}`;
  await tx.$executeRaw`
    UPDATE "User"
    SET "subjects" = array_replace("subjects", ${oldName}::text, ${newName}::text)
    WHERE "schoolId" = ${schoolId}`;
}
