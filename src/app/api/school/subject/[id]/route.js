// import { NextResponse } from "next/server";
// import prisma from "../../../../../../prisma/prisma";

// export async function DELETE(request, { params }) {
//   const { id } = params;
//   {
//     const [schoolId, subjectName] = id.split("-");
//     console.log(schoolId, subjectName);
//     console.log(subjectName);
//     try {
//       // Fetch the current subjects
//       const school = await prisma.school.findUnique({
//         where: { id: Number(schoolId) },
//         select: { subjects: true },
//       });
//       console.log(school);
//       if (!school) {
//         return NextResponse.json(
//           { message: "School not found" },
//           { status: 200 }
//         );
//       } else {
//         console.log("first");
//         const updatedSubjects = school.subjects.filter(
//           (subject) => subject !== subjectName
//         );
//         // Update the school's subjects
//         await prisma.school.update({
//           where: { id: Number(schoolId) },
//           data: { subjects: updatedSubjects },
//         });

//         return NextResponse.json(
//           { message: "Subject deleted successfully" },
//           { status: 200 }
//         );
//       }
//     } catch (error) {
//       console.error(error);
//       return NextResponse.json(
//         { message: "Internal Server Error" },
//         { status: 200 }
//       );
//     }
//   }
// }

// src/app/api/school-subjects/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { HttpError, cleanName, legacyAddToSchool } from "@/app/lib/subjects";

// Never cache: the list must always reflect renames/creations.
export const dynamic = "force-dynamic";

// GET /api/school-subjects?schoolId=1  ->  { subjects: [{ id, name, archived }] }
export async function GET(req) {
  const schoolId = Number(new URL(req.url).searchParams.get("schoolId"));
  if (!Number.isInteger(schoolId)) {
    return NextResponse.json(
      { message: "schoolId is required" },
      { status: 400 },
    );
  }

  try {
    const subjects = await prisma.schoolSubject.findMany({
      where: { schoolId, archived: false },
      select: { id: true, name: true, archived: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ subjects }, { status: 200 });
  } catch (error) {
    console.error("Error fetching school subjects:", error);
    return NextResponse.json(
      { message: "Failed to fetch subjects" },
      { status: 500 },
    );
  }
}

// POST /api/school-subjects  { schoolId, name }
export async function POST(req) {
  const body = await req.json();
  const schoolId = Number(body.schoolId);
  const name = cleanName(body.name);

  if (!Number.isInteger(schoolId) || !name) {
    return NextResponse.json(
      { message: "Please enter a valid subject name." },
      { status: 400 },
    );
  }

  try {
    const subject = await prisma.$transaction(async (tx) => {
      const clash = await tx.schoolSubject.findFirst({
        where: { schoolId, name: { equals: name, mode: "insensitive" } },
      });
      if (clash) throw new HttpError(409, "Subject already exists.");

      const created = await tx.schoolSubject.create({
        data: { schoolId, name },
        select: { id: true, name: true, archived: true },
      });
      await legacyAddToSchool(tx, schoolId, name); // transition only
      return created;
    });

    return NextResponse.json(
      { message: "Subject created successfully.", subject },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { message: "Failed to create subject" },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  const id = Number(params.id);
  const newName = cleanName((await req.json()).name);

  if (!Number.isInteger(id) || !newName) {
    return NextResponse.json(
      { message: "Please enter a valid subject name." },
      { status: 400 },
    );
  }

  try {
    const subject = await prisma.$transaction(
      async (tx) => {
        const current = await tx.schoolSubject.findUnique({ where: { id } });
        if (!current) throw new HttpError(404, "Subject not found.");
        if (current.name === newName) return current;

        const clash = await tx.schoolSubject.findFirst({
          where: {
            schoolId: current.schoolId,
            id: { not: id },
            name: { equals: newName, mode: "insensitive" },
          },
        });
        if (clash)
          throw new HttpError(409, "Another subject already has that name.");

        const updated = await tx.schoolSubject.update({
          where: { id },
          data: { name: newName },
          select: { id: true, name: true, archived: true },
        });

        // Transition only: keep the old text copies in step so a rollback is safe.
        await tx.subject.updateMany({
          where: { schoolSubjectId: id },
          data: { subjectName: newName },
        });
        await legacyRename(tx, current.schoolId, current.name, newName);

        return updated;
      },
      { timeout: 30000 },
    );

    return NextResponse.json(
      { message: "Subject renamed successfully.", subject },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Some student records already use that name. Run the backfill report and fix the conflicts first.",
        },
        { status: 409 },
      );
    }
    console.error("Error renaming subject:", error);
    return NextResponse.json(
      { message: "Failed to rename subject" },
      { status: 500 },
    );
  }
}
