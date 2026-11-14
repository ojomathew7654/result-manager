import { NextResponse } from "next/server";
import prisma from "../../../../prisma/prisma";

export async function GET() {
  const allSchools = await prisma.school.findMany();
  return NextResponse.json(allSchools, { status: 200 });
}
