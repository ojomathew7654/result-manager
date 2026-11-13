import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// export async function PATCH(request, { params }) {
//   const { id } = params;
//   const { subjectsToAdd } = await request.json();

//   try {
//     // Fetch the user by ID
//     const user = await prisma.user.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!user) {
//       throw new Error("User not found");
//     }

//     // Directly replace the user's existing subjects with the new subjects
//     const updatedSubjectsArray = subjectsToAdd;

//     // Update the user's subjects in the database
//     await prisma.user.update({
//       where: { id: Number(id) },
//       data: { subjects: updatedSubjectsArray },
//     });

//     // Return a success message
//     return NextResponse.json(
//       { message: "Subjects updated successfully" },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error(err);
//     throw new Error("Failed to replace subjects for user");
//   } finally {
//     await prisma.$disconnect();
//   }
// }

export async function PATCH(request, { params }) {
  const userId = Number(params.id);
  const { subjectIds } = await request.json();

  if (!Number.isInteger(userId) || !Array.isArray(subjectIds)) {
    return NextResponse.json(
      { message: "subjectIds must be an array of subject ids." },
      { status: 400 },
    );
  }

  const ids = [...new Set(subjectIds.map(Number))];
  if (ids.some((n) => !Number.isInteger(n))) {
    return NextResponse.json(
      { message: "Invalid subject id." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Only subjects that belong to this teacher's own school are allowed.
    const subjects = await prisma.schoolSubject.findMany({
      where: { id: { in: ids }, schoolId: user.schoolId },
      select: { id: true, name: true },
    });
    if (subjects.length !== ids.length) {
      return NextResponse.json(
        { message: "One or more subjects do not belong to this school." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        assignedSubjects: { set: subjects.map((s) => ({ id: s.id })) },
        subjects: subjects.map((s) => s.name), // legacy copy, transition only
      },
    });

    return NextResponse.json(
      { message: "Subjects updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to update subjects for user" },
      { status: 500 },
    );
  }
}
