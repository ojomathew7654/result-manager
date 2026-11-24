import { NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const selectedClass = searchParams.get("selectedClass");
    const [level, variant] = selectedClass.split("-");
    const academicYear = searchParams.get("academicYear");
    const selectedTerm = searchParams.get("selectedTerm");

    if (!schoolId || !level || !selectedTerm || !academicYear) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields", status: 400 }),
        { status: 400 },
      );
    }

    // Build the query
    let whereClause = { schoolId: Number(schoolId), level, academicYear };
    if (variant) whereClause.variant = variant;

    // Fetch students in the same class, filter terms by selectedTerm
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        terms: {
          where: {
            termType: selectedTerm, // Filter terms by the selectedTerm
          },
          include: {
            subjects: true,
          },
        },
      },
    });

    if (!students.length) {
      return new NextResponse(
        JSON.stringify({ message: "No students found", status: 404 }),
        { status: 404 },
      );
    }

    // Process student data
    const processedStudents = students.map((student) => {
      const filteredTerms = student.terms.map((term) => {
        // const filteredSubjects = term.subjects.filter((subject) => {
        //   const totalScore =
        //     (subject.firstCA || 0) +
        //     (subject.secondCA || 0) +
        //     (subject.thirdCA || 0) +
        //     (subject.fourthCA || 0) +
        //     (subject.fifthCA || 0) +
        //     (subject.sixthCA || 0) +
        //     (subject.note || 0) +
        //     (subject.rt || 0) +
        //     (subject.project || 0) +
        //     (subject.affective || 0) +
        //     (subject.assignment || 0) +
        //     (subject.exam || 0);
        //   return totalScore > 0;
        // });

        const filteredSubjects = term.subjects
          .filter((subject) => {
            const totalScore =
              (subject.firstCA || 0) +
              (subject.secondCA || 0) +
              (subject.thirdCA || 0) +
              (subject.fourthCA || 0) +
              (subject.fifthCA || 0) +
              (subject.sixthCA || 0) +
              (subject.note || 0) +
              (subject.rt || 0) +
              (subject.project || 0) +
              (subject.affective || 0) +
              (subject.assignment || 0) +
              (subject.exam || 0);

            return totalScore > 0;
          })
          .map(({ schoolSubjectId, ...subject }) => subject);

        return { ...term, subjects: filteredSubjects };
      });

      return { ...student, terms: filteredTerms };
    });

    return new NextResponse(JSON.stringify(processedStudents), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching student data:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Failed to fetch data",
        error: error.message,
        status: 500,
      }),
      { status: 500 },
    );
  }
}
