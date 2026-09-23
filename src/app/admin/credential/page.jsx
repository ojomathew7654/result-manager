"use client";

import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import { Printer, Key, GraduationCap, Globe, User } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

const StudentCredential = () => {
  const contentToPrint = useRef(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Student_Credentials",
    content: () => contentToPrint.current,
    onBeforePrint: () => console.log("before printing..."),
    onAfterPrint: () => console.log("after printing..."),
    removeAfterPrint: true,
  });

  const [students, setStudents] = useState({ div1: [], div2: [] });
  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const [academicYear, setAcademicYear] = useState("");

  const fetchStudents = async (year) => {
    if (!year) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/student?schoolId=${session.schoolId}&academicYear=${year}`
      );

      // Sort students by level
      const sortedStudents = [...data].sort((a, b) =>
        (a.level || "").localeCompare(b.level || "")
      );

      // Distribute students evenly across div1 and div2
      const div1 = [];
      const div2 = [];

      sortedStudents.forEach((student, index) => {
        if (index % 2 === 0) {
          div1.push(student);
        } else {
          div2.push(student);
        }
      });

      setStudents({ div1, div2 });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    const selectedYear = event.target.value;
    setAcademicYear(selectedYear);
    await fetchStudents(selectedYear);
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm font-medium text-ink-500">Please wait...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  const totalStudents = students.div1.length + students.div2.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="no-print">
        <PageHeader
         dark={false}
          title="Student Credentials"
          subtitle="Generate and print portal login credential slips for students."
        />

        {/* Filter and Print Control Card */}
        <Card className="mt-4">
          <CardHeader
            title="Credential Slip Generator"
            subtitle="Select academic year to view and print student credentials"
            action={
              <Button
                onClick={handlePrint}
                disabled={totalStudents === 0 || loading}
                variant="primary"
                icon={Printer}
              >
                Print Slips
              </Button>
            }
          />
          <CardBody className="space-y-4">
            <div className="max-w-xs">
              <Field label="Academic Year">
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
            </div>
          </CardBody>
        </Card>
      </div>

      {loading && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
          <Spinner />
          <p className="text-sm text-ink-500">Fetching student credentials...</p>
        </div>
      )}

      {/* Printable Report Section */}
      {!loading && (
        <div ref={contentToPrint} className="space-y-4 bg-white p-4">
          {totalStudents > 0 && (
            <div className="mb-4 border-b border-ink-200 pb-3">
              <h2 className="text-xl font-bold text-ink-900">Student Portal Login Details</h2>
              <p className="text-xs text-ink-500">Academic Year: {academicYear} | Total Students: {totalStudents}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-4">
              {students.div1.map((student, index) => (
                <div
                  key={index}
                  className="rounded-lg border-2 border-dashed border-ink-300 p-3 bg-white space-y-2 text-xs page-break-inside-avoid"
                >
                  <div className="flex items-center justify-between border-b border-ink-200 pb-1.5">
                    <span className="font-semibold text-brand-700 flex items-center gap-1">
                      <Globe size={12} /> Portal Link:
                    </span>
                    <span className="font-mono text-ink-600">result-manager.ascodeelevate.com</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <span className="text-ink-400 font-medium">Class:</span>
                      <p className="font-semibold text-ink-900 uppercase">{student.level}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Name:</span>
                      <p className="font-semibold text-ink-900">{student.name}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Username:</span>
                      <p className="font-mono font-semibold text-ink-900">{student.username}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Password:</span>
                      <p className="font-mono font-semibold text-ink-900">{student.password}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              {students.div2.map((student, index) => (
                <div
                  key={index}
                  className="rounded-lg border-2 border-dashed border-ink-300 p-3 bg-white space-y-2 text-xs page-break-inside-avoid"
                >
                  <div className="flex items-center justify-between border-b border-ink-200 pb-1.5">
                    <span className="font-semibold text-brand-700 flex items-center gap-1">
                      <Globe size={12} /> Portal Link:
                    </span>
                    <span className="font-mono text-ink-600">result-manager.ascodeelevate.com</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <span className="text-ink-400 font-medium">Class:</span>
                      <p className="font-semibold text-ink-900 uppercase">{student.level}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Name:</span>
                      <p className="font-semibold text-ink-900">{student.name}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Username:</span>
                      <p className="font-mono font-semibold text-ink-900">{student.username}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Password:</span>
                      <p className="font-mono font-semibold text-ink-900">{student.password}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCredential;
