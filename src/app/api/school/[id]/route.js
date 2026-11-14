import { NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function PATCH(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    const { termType, nextTermBegin, termBegins, termEnds, ...schoolData } =
      body;
    if (Object.keys(schoolData).length > 0) {
      await prisma.school.update({
        where: { id: Number(id) },
        data: schoolData,
      });
    }
    // Update or Create Term Date
    if (termType && nextTermBegin) {
      const existingTermDate = await prisma.termDate.findFirst({
        where: {
          schoolId: Number(id),
          termType: termType,
        },
      });

      if (existingTermDate) {
        await prisma.termDate.update({
          where: { id: existingTermDate.id },
          data: {
            nextTermBegin,
            termBegins,
            termEnds,
          },
        });
      } else {
        await prisma.termDate.create({
          data: {
            termType,
            nextTermBegin,
            termBegins,
            termEnds,
            schoolId: Number(id),
          },
        });
      }
    }

    return NextResponse.json(
      { message: "School data updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Failed to update School or Term Date" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request, { params }) {
  const { id } = await params;
  const schoolId = Number(id);

  if (!Number.isInteger(schoolId)) {
    return NextResponse.json({ error: "Invalid school id" }, { status: 400 });
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { termDates: true },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    return NextResponse.json(school);
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json(
      { error: "Failed to fetch school" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  try {
    await prisma.school.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json(
      { message: "School deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error delete School:", error);
    return NextResponse.json(
      { error: "Failed to delete School" },
      { status: 500 },
    );
  }
}
