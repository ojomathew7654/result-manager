import { NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request, { params }) {
  const { schoolId } = params;
  try {
    const numericSchoolId = Number(schoolId);
    if (!Number.isInteger(numericSchoolId)) {
      return NextResponse.json({ error: "Invalid school ID" }, { status: 400 });
    }

    const [
      totalStudents,
      secondaryStudents,
      totalMaleStudents,
      totalFemaleStudents,
      totalUsers,
      totalAdmins,
      totalMaleUsers,
      totalFemaleUsers,
    ] = await Promise.all([
      prisma.student.count({ where: { schoolId: numericSchoolId } }),
      prisma.student.count({
        where: {
          schoolId: numericSchoolId,
          OR: [
            { level: { contains: "js", mode: "insensitive" } },
            { level: { contains: "ss", mode: "insensitive" } },
          ],
        },
      }),
      prisma.student.count({
        where: { schoolId: numericSchoolId, gender: { equals: "male", mode: "insensitive" } },
      }),
      prisma.student.count({
        where: { schoolId: numericSchoolId, gender: { equals: "female", mode: "insensitive" } },
      }),
      prisma.user.count({ where: { schoolId: numericSchoolId, role: "USER" } }),
      prisma.user.count({ where: { schoolId: numericSchoolId, role: { in: ["ADMIN", "ACCOUNTANT"] } } }),
      prisma.user.count({
        where: { schoolId: numericSchoolId, role: "USER", gender: { equals: "male", mode: "insensitive" } },
      }),
      prisma.user.count({
        where: { schoolId: numericSchoolId, role: "USER", gender: { equals: "female", mode: "insensitive" } },
      }),
    ]);

    const primaryStudents = totalStudents - secondaryStudents;

    return NextResponse.json({
      totalStudents,
      primaryStudents,
      secondaryStudents,
      totalMaleStudents,
      totalFemaleStudents,
      totalUsers,
      totalAdmins,
      totalMaleUsers,
      totalFemaleUsers,
    });
  } catch (err) {
    console.error("Failed to fetch student counts:", err);
    return NextResponse.json(
      { error: "Failed to fetch student counts" },
      { status: 500 }
    );
  }
}
