import { NextResponse } from "next/server";
import prisma from "../../../../prisma/prisma";

export async function PUT(req) {
  try {
    const {
      schoolId,
      level,
      variant,
      academicYear,
      nextLevel,
      nextVariant,
      nextAcademicYear,
    } = await req.json();
    console.log(variant);
    console.log(nextVariant);
    // Validate required fields
    if (
      !schoolId ||
      !level ||
      !academicYear ||
      !nextLevel ||
      !nextAcademicYear
    ) {
      return NextResponse.json(
        {
          error:
            "schoolId, level, academicYear, nextLevel, and nextAcademicYear are required",
        },
        { status: 400 },
      );
    }

    // Find students matching the current criteria
    const whereClause = {
      schoolId: Number(schoolId),
      level,
      academicYear,
    };

    if (variant) {
      whereClause.variant = variant;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: { id: true },
    });

    const studentIds = students.map((student) => student.id);

    if (studentIds.length === 0) {
      return NextResponse.json(
        { message: "No students found for the selected criteria" },
        { status: 404 },
      );
    }

    // Delete related records
    await prisma.attendance.deleteMany({
      where: { studentId: { in: studentIds } },
    });

    await prisma.attendanceList.deleteMany({
      where: { studentId: { in: studentIds } },
    });

    await prisma.payment.deleteMany({
      where: { studentId: { in: studentIds } },
    });

    await prisma.resultAvailability.deleteMany({
      where: { studentId: { in: studentIds } },
    });

    await prisma.traitRating.deleteMany({
      where: { studentId: { in: studentIds } },
    });

    await prisma.studentTask.deleteMany({
      where: { studentId: { in: studentIds } },
    });

    // Reset subjects
    const terms = await prisma.term.findMany({
      where: { studentId: { in: studentIds } },
      select: { id: true },
    });

    for (const term of terms) {
      await prisma.subject.updateMany({
        where: { termId: term.id },
        data: {
          firstCA: null,
          secondCA: null,
          thirdCA: null,
          fourthCA: null,
          fifthCA: null,
          sixthCA: null,
          project: null,
          note: null,
          rt: null,
          affective: null,
          assignment: null,
          exam: null,
        },
      });
    }

    // Update students' level, variant, and academic year
    await prisma.student.updateMany({
      where: whereClause,
      data: {
        level: nextLevel,
        variant: nextVariant || null,
        academicYear: nextAcademicYear,
      },
    });

    return NextResponse.json(
      {
        message: `${studentIds.length} students successfully moved to ${nextLevel}${
          nextVariant ? ` ${nextVariant}` : ""
        } for ${nextAcademicYear}. Previous records cleared and subjects preserved.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error promoting students:", error);

    return NextResponse.json(
      {
        error: "Failed to promote students",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
