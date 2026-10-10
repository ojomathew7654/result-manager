"use client";

import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Printer, Users } from "lucide-react";

const AllTeacherStudents = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");

  const fetchStudentData = async (cls, yr) => {
    if (!cls || !yr || !session?.schoolId) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(yr);
      const { data } = await axios.get(
        `/api/student/class/FIRST-${session.schoolId}-${encodedAcademicYear}-${cls}`
      );
      setStudents(data || []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
    setLoading(false);
  };

  const handleAcademicYearChange = async (event) => {
    const yr = event.target.value;
    setAcademicYear(yr);
    await fetchStudentData(selectedClass, yr);
  };

  const handleClassChange = async (e) => {
    const cls = e.target.value;
    setSelectedClass(cls);
    await fetchStudentData(cls, academicYear);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-white">
        <Spinner />
        <p className="text-sm font-medium text-ink-300">Loading student print portal...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  const sortedStudents = [...students].sort((a, b) => {
    const surnameA = (a.surname || "").toLowerCase().trim();
    const surnameB = (b.surname || "").toLowerCase().trim();
    return surnameA.localeCompare(surnameB);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Print Student Report Cards"
        subtitle="Select academic year and class to view and print student report cards."
      />

      {/* Filter Card */}
      <Card>
        <CardHeader
          title="Selection Filters"
          subtitle="Choose academic year and class to load student print roster."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Academic Year" htmlFor="academicYearSelect">
            <Select
              id="academicYearSelect"
              value={academicYear}
              onChange={handleAcademicYearChange}
            >
              <option value="" disabled>
                Select academic year
              </option>
              <option value="2025/2026">2025/2026</option>
            </Select>
          </Field>

          <Field label="Class" htmlFor="classSelect">
            <Select id="classSelect" value={selectedClass} onChange={handleClassChange}>
              <option value="">Select class</option>
              {session?.teacherOf?.map((classItem) => (
                <option key={classItem} value={classItem}>
                  {classItem}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {/* Roster Table Card */}
      <Card>
        {!selectedClass ? (
          <CardBody className="flex min-h-[200px] flex-col items-center justify-center text-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
              <Users size={24} />
            </div>
            <h3 className="font-medium text-ink-900 text-base">Select Class & Academic Year</h3>
            <p className="text-sm text-ink-400 mt-1 max-w-sm">
              Please choose a class from the options above to load student print cards.
            </p>
          </CardBody>
        ) : loading ? (
          <CardBody className="flex min-h-[200px] flex-col items-center justify-center p-8">
            <Spinner />
            <p className="text-sm font-medium text-ink-400 mt-3">Fetching student roster...</p>
          </CardBody>
        ) : sortedStudents.length > 0 ? (
          <>
            <CardHeader
              title={`Print Roster — ${selectedClass}`}
              subtitle={`Total Students: ${sortedStudents.length}`}
            />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-ink-100 bg-ink-50 text-ink-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Surname</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3">Variant</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 bg-white">
                    {sortedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-ink-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink-900">{student.surname || "-"}</td>
                        <td className="px-4 py-3 text-ink-700">{student.name || "-"}</td>
                        <td className="px-4 py-3 text-ink-500 font-mono">{student.username || "-"}</td>
                        <td className="px-4 py-3 uppercase text-ink-600">{student.level || "-"}</td>
                        <td className="px-4 py-3 text-ink-500">{student.variant || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            as={Link}
                            href={`/print/${student.id}`}
                            size="sm"
                            variant="primary"
                            icon={Printer}
                          >
                            Print Result
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </>
        ) : (
          <CardBody className="flex min-h-[200px] flex-col items-center justify-center text-center p-8">
            <h3 className="font-medium text-ink-900 text-base">No Students Found</h3>
            <p className="text-sm text-ink-400 mt-1">
              No students were found for the selected class and academic year.
            </p>
          </CardBody>
        )}
      </Card>
    </div>
  );
};

export default AllTeacherStudents;
