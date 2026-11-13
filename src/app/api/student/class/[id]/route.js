import { NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

// const SCORE_FIELDS = [
//   "firstCA",
//   "secondCA",
//   "thirdCA",
//   "fourthCA",
//   "fifthCA",
//   "sixthCA",
//   "assignment",
//   "project",
//   "note",
//   "rt",
//   "affective",
//   "exam",
// ];

// const pickScores = (scores = {}) =>
//   Object.fromEntries(SCORE_FIELDS.map((f) => [f, scores[f]]));

// export async function PATCH(request, { params }) {
//   const { termType, records } = await request.json();

//   if (!termType || !Array.isArray(records)) {
//     return NextResponse.json(
//       { message: "termType and records are required" },
//       { status: 400 },
//     );
//   }

//   try {
//     // All-or-nothing: if any subject fails, nothing is saved.
//     await prisma.$transaction(
//       async (tx) => {
//         for (const { studentId, record } of records) {
//           if (!record?.subjectName) {
//             console.error(`Subject name is required for student ${studentId}.`);
//             continue;
//           }

//           const sid = Number(studentId);
//           const student = await tx.student.findUnique({ where: { id: sid } });
//           if (!student) {
//             console.error(`Student with ID ${studentId} not found`);
//             continue;
//           }

//           // Same student appears in several records; the loop is sequential,
//           // so the first creates the term and the rest find it.
//           let term = await tx.term.findFirst({
//             where: { studentId: sid, termType },
//             include: { subjects: true },
//           });

//           if (!term) {
//             term = await tx.term.create({
//               data: { studentId: sid, termType },
//               include: { subjects: true },
//             });
//           }

//           const scores = pickScores(record.scores);
//           const existing = term.subjects.find(
//             (s) => s.subjectName === record.subjectName,
//           );

//           if (existing) {
//             const data = {};
//             for (const f of SCORE_FIELDS) {
//               data[f] = scores[f] ?? existing[f];
//             }
//             await tx.subject.update({ where: { id: existing.id }, data });
//           } else {
//             await tx.subject.create({
//               data: {
//                 subjectName: record.subjectName,
//                 ...scores,
//                 termId: term.id,
//               },
//             });
//           }
//         }
//       },
//       { timeout: 20000 }, // a full student can mean ~15+ subjects
//     );

//     return NextResponse.json(
//       { message: "Data updated successfully" },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error("Error adding or updating data to term:", error);
//     return NextResponse.json(
//       { message: "Failed to update data" },
//       { status: 500 },
//     );
//   }
// }
const TERM_TYPES = ["FIRST", "SECOND", "THIRD"];
const SCORE_FIELDS = [
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
export async function PUT(request) {
  try {
    // Parse the request body
    const { updates } = await request.json();
    console.log(updates);
    const testQuery = await prisma.resultAvailability.findFirst();
    console.log(testQuery);

    // Check if there's anything to update
    const filteredUpdates = updates.filter(
      ({ isAvailable, termType, studentId }) =>
        isAvailable !== undefined && termType && studentId,
    );
    console.log(filteredUpdates);
    const updatePromises = filteredUpdates.map(
      async ({ studentId, termType, isAvailable }) => {
        return prisma.resultAvailability.upsert({
          where: {
            // Use the `unique_student_term_result_availability` constraint directly
            unique_student_term_result_availability: {
              studentId: Number(studentId),
              termType,
            },
          },
          update: {
            available: isAvailable,
          },
          create: {
            studentId: Number(studentId),
            termType,
            available: isAvailable,
          },
        });
      },
    );
    await Promise.all(updatePromises);

    // Return a successful response
    return NextResponse.json(
      { message: "Result availability updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating student result availability:", error);
    return NextResponse.json(
      { error: "Failed to update result availability" },
      { status: 500 },
    );
  }
}

export async function GET(request, { params }) {
  const { id } = params;
  const [termType, schoolId, encodedAcademicYear, level, variant] =
    id.split("-");
  const academicYear = decodeURIComponent(encodedAcademicYear);
  if (!level || !schoolId || !termType || !academicYear) {
    return NextResponse.json(
      { error: "Level, School ID, and termType are required" },
      { status: 400 },
    );
  }

  try {
    let whereClause = {
      level: level,
      schoolId: Number(schoolId),
      academicYear,
    };
    if (variant) {
      whereClause.variant = variant;
    }

    const studentsWithResults = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        surname: true,
        level: true,
        image: true,
        variant: true,
        gender: true,
        resultAvailability: true,
        password: true,
        username: true,
        attendanceList: true,
      },
    });

    return NextResponse.json(studentsWithResults);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students by class" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  const { termType, records } = await request.json();

  if (!TERM_TYPES.includes(termType) || !Array.isArray(records)) {
    return NextResponse.json(
      { message: "termType and records are required" },
      { status: 400 },
    );
  }

  // Validate and clean the payload first. Score columns are Int in the
  // schema, so decimals are rejected with a clear message instead of a 500.
  const cleaned = [];
  try {
    for (const { studentId, record } of records) {
      const sid = Number(studentId);
      const subjectId = Number(record?.subjectId);
      if (!Number.isInteger(sid) || !Number.isInteger(subjectId)) {
        throw new HttpError(
          400,
          "Each record needs a studentId and a subjectId.",
        );
      }
      const scores = {};
      for (const field of SCORE_FIELDS) {
        const v = record.scores?.[field];
        if (v === undefined || v === null || v === "") continue;
        if (!Number.isInteger(Number(v))) {
          throw new HttpError(400, "Scores must be whole numbers.");
        }
        scores[field] = Number(v);
      }
      cleaned.push({ studentId: sid, subjectId, scores });
    }

    await prisma.$transaction(
      async (tx) => {
        const ids = [...new Set(cleaned.map((r) => r.subjectId))];
        const schoolSubjects = await tx.schoolSubject.findMany({
          where: { id: { in: ids } },
        });
        const byId = new Map(schoolSubjects.map((s) => [s.id, s]));

        for (const { studentId, subjectId, scores } of cleaned) {
          const schoolSubject = byId.get(subjectId);
          if (!schoolSubject)
            throw new HttpError(400, `Unknown subject ${subjectId}.`);

          const student = await tx.student.findUnique({
            where: { id: studentId },
            select: { id: true, schoolId: true },
          });
          if (!student) {
            console.error(`Student with ID ${studentId} not found`);
            continue;
          }
          // a student can only receive scores for their own school's subjects
          if (student.schoolId !== schoolSubject.schoolId) {
            throw new HttpError(
              400,
              "Subject does not belong to the student's school.",
            );
          }

          let term = await tx.term.findFirst({
            where: { studentId, termType },
            select: { id: true },
          });
          if (!term) {
            term = await tx.term.create({
              data: { studentId, termType },
              select: { id: true },
            });
          }

          // linked row, or an old unlinked row with the same name
          const existing = await tx.subject.findFirst({
            where: {
              termId: term.id,
              OR: [
                { schoolSubjectId: subjectId },
                { subjectName: schoolSubject.name, schoolSubjectId: null },
              ],
            },
          });

          if (existing) {
            const data = {
              schoolSubjectId: subjectId,
              subjectName: schoolSubject.name,
            };
            for (const f of SCORE_FIELDS) data[f] = scores[f] ?? existing[f];
            await tx.subject.update({ where: { id: existing.id }, data });
          } else {
            await tx.subject.create({
              data: {
                termId: term.id,
                schoolSubjectId: subjectId,
                subjectName: schoolSubject.name, // legacy copy, transition only
                ...scores,
              },
            });
          }
        }
      },
      { timeout: 20000 },
    );

    return NextResponse.json(
      { message: "Data updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error("Error adding or updating data to term:", error);
    return NextResponse.json(
      { message: "Failed to update data" },
      { status: 500 },
    );
  }
}
