"use client";
import React, { useState, useEffect } from "react";
import { parse, addDays, format, differenceInDays } from "date-fns";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CalendarCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

const resumptionDateStr = "Monday 22/04/2024";
const days = ["M", "T", "W", "TH", "F"];
const weeks = Array.from({ length: 13 }, (_, i) => `WEEK ${i + 1}`);

const AttendanceRegister = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState("");
  const [termType, setTermType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const resumptionDate = parse(
    resumptionDateStr,
    "EEEE dd/MM/yyyy",
    new Date()
  );
  const currentDate = new Date();
  const totalDays = differenceInDays(currentDate, resumptionDate);
  const currentWeekIndex = Math.floor(totalDays / 7);
  const currentDayIndex = totalDays % 7;

  const { data: session, status: sessionStatus } = useSession();
  const [schoolClasses, setSchoolClasses] = useState([]);

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchoolClasses(data.classes || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };
    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.role !== "ADMIN") {
      signOut({ redirect: false }).then(() => redirect("/"));
    }
  }, [sessionStatus, session]);

  useEffect(() => {
    if (students.length > 0) {
      setAttendance((prevAttendance) => {
        const newAttendance = { ...prevAttendance };
        for (const student of students) {
          if (!newAttendance[student.id]) {
            newAttendance[student.id] = weeks.reduce((weekAcc, week) => {
              weekAcc[week] = {
                M: false,
                T: false,
                W: false,
                TH: false,
                F: false,
              };
              return weekAcc;
            }, {});
          }
          if (student.attendance && student.attendance.length > 0) {
            const presentDates = student.attendance[0].presentDates || [];
            for (const dateStr of presentDates) {
              const date = new Date(dateStr);
              const weekIndex = Math.floor(
                differenceInDays(date, resumptionDate) / 7
              );
              const dayIndex = differenceInDays(date, resumptionDate) % 7;
              const week = `WEEK ${weekIndex + 1}`;
              const day = days[dayIndex];
              if (newAttendance[student.id][week]) {
                newAttendance[student.id][week][day] = true;
              }
            }
          }
        }
        return newAttendance;
      });
    }
  }, [students]);

  const getAttendanceDate = (weekIndex, dayIndex) => {
    return format(
      addDays(resumptionDate, weekIndex * 7 + dayIndex),
      "yyyy/MM/dd"
    );
  };

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    if (!termType || !selectedClass || !academicYear) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/student/class/${termType}-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`
      );
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching student attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    const value = event.target.value;
    setAcademicYear(value);
    await fetchStudentData(termType, selectedClass, value);
  };

  const handleClassChange = async (event) => {
    const value = event.target.value;
    setSelectedClass(value);
    await fetchStudentData(termType, value, academicYear);
  };

  const handleTermChange = async (event) => {
    const value = event.target.value;
    setTermType(value);
    await fetchStudentData(value, selectedClass, academicYear);
  };

  const handleCheck = (student, week, day) => {
    const newAttendance = { ...attendance };
    if (!newAttendance[student.id]) {
      newAttendance[student.id] = {};
    }
    if (!newAttendance[student.id][week]) {
      newAttendance[student.id][week] = {
        M: false,
        T: false,
        W: false,
        TH: false,
        F: false,
      };
    }
    newAttendance[student.id][week][day] =
      !newAttendance[student.id][week][day];
    setAttendance(newAttendance);
  };

  const updateAttendance = async () => {
    if (!academicYear || !termType) {
      alert("Please select academic year and term");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        students.map(async (student) => {
          let totalPresent = 0;
          let totalAbsent = 0;
          const presentDates = [];
          const absentDates = [];
          for (const week in attendance[student.id]) {
            for (const day in attendance[student.id][week]) {
              const isPresent = attendance[student.id][week][day];
              const weekIndex = parseInt(week.split(" ")[1]) - 1;
              const dayIndex = days.indexOf(day);
              const date = getAttendanceDate(weekIndex, dayIndex);

              if (isPresent) {
                totalPresent++;
                presentDates.push(date);
              } else {
                totalAbsent++;
                absentDates.push(date);
              }
            }
          }
          await axios.patch(`/api/student/attendance`, {
            username: student.username,
            totalPresent,
            totalAbsent,
            presentDates,
            absentDates,
            academicYear,
            termType,
          });
        })
      );
      alert("Attendance updated successfully.");
    } catch (err) {
      console.error("Failed to update attendance", err);
      alert("Network Error. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = (studentId) => {
    const studentAttendance = attendance[studentId] || {};
    return Object.values(studentAttendance).reduce((total, week) => {
      return (
        total +
        Object.values(week).reduce((weekTotal, day) => {
          return weekTotal + (day ? 1 : 0);
        }, 0)
      );
    }, 0);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500">
        <Spinner /> Please wait...
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div>
      <PageHeader
        title="Attendance Register"
        subtitle="Manage and mark student attendance by session, term, and class."
        action={
          <Button as={Link} href="/admin" variant="outline" icon={ArrowLeft}>
            Dashboard
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Class" htmlFor="classSelect">
            <Select
              id="classSelect"
              value={selectedClass}
              onChange={handleClassChange}
            >
              <option value="" disabled>
                Select Class
              </option>
              {schoolClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Term" htmlFor="termSelect">
            <Select id="termSelect" value={termType} onChange={handleTermChange}>
              <option value="" disabled>
                Select Term
              </option>
              <option value="FIRST">First Term</option>
              <option value="SECOND">Second Term</option>
              <option value="THIRD">Third Term</option>
            </Select>
          </Field>

          <Field label="Academic Year" htmlFor="academicYearSelect">
            <Select
              id="academicYearSelect"
              value={academicYear}
              onChange={handleAcademicYearChange}
            >
              <option value="" disabled>
                Select Academic Year
              </option>
              <option value="2025/2026">2025/2026</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      {selectedClass !== "" ? (
        <div className="space-y-6">
          {weeks.reduce((acc, week, index) => {
            if (index % 2 === 0) {
              acc.push(
                <Card key={week}>
                  <CardBody className="overflow-x-auto p-0">
                    <table className="min-w-full text-left text-sm border-collapse">
                      <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                        <tr>
                          <th rowSpan={2} className="px-4 py-3 border-r border-ink-100">No</th>
                          <th rowSpan={2} className="px-4 py-3 border-r border-ink-100">Surname</th>
                          <th rowSpan={2} className="px-4 py-3 border-r border-ink-100">Name</th>
                          {weeks.slice(index, index + 2).map((w, weekIndex) => (
                            <th
                              key={w}
                              colSpan={days.length}
                              className={`px-4 py-2 text-center border-r border-ink-100 ${
                                index + weekIndex === currentWeekIndex
                                  ? "bg-brand-50 font-bold text-brand-700"
                                  : ""
                              }`}
                            >
                              {w}
                            </th>
                          ))}
                          {index + 2 >= weeks.length && (
                            <th rowSpan={2} className="px-4 py-3 text-center">Total</th>
                          )}
                        </tr>
                        <tr className="border-t border-ink-100">
                          {weeks.slice(index, index + 2).map((w, weekIndex) =>
                            days.map((day, dayIndex) => (
                              <th
                                key={w + day}
                                className={`px-2 py-1 text-center text-xs font-semibold ${
                                  dayIndex === currentDayIndex &&
                                  index + weekIndex === currentWeekIndex
                                    ? "bg-amber-100 text-amber-900"
                                    : ""
                                }`}
                              >
                                {day.charAt(0)}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      {loading ? (
                        <tbody>
                          <tr>
                            <td colSpan={3 + days.length * 2 + 1} className="px-5 py-10 text-center text-ink-400">
                              Loading student register...
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody className="divide-y divide-ink-100">
                          {students.map((student, studentIndex) => (
                            <tr key={student.id} className="hover:bg-ink-50/60">
                              <td className="px-4 py-3 text-ink-500 border-r border-ink-100">{studentIndex + 1}</td>
                              <td className="px-4 py-3 font-medium text-ink-900 border-r border-ink-100">{student.surname}</td>
                              <td className="px-4 py-3 font-medium text-ink-900 border-r border-ink-100">{student.name}</td>
                              {weeks.slice(index, index + 2).map((w) =>
                                days.map((day) => (
                                  <td key={student.id + w + day} className="px-2 py-2 text-center border-r border-ink-100">
                                    <input
                                      type="checkbox"
                                      checked={
                                        attendance[student.id]?.[w]?.[day] || false
                                      }
                                      onChange={() => handleCheck(student, w, day)}
                                      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                    />
                                  </td>
                                ))
                              )}
                              {index + 2 >= weeks.length && (
                                <td className="px-4 py-3 text-center font-bold text-brand-700">
                                  {calculateTotal(student.id)}
                                </td>
                              )}
                            </tr>
                          ))}
                          {!students.length && (
                            <tr>
                              <td colSpan={3 + days.length * 2 + 1} className="px-5 py-10 text-center text-ink-400">
                                No students found for the selected class.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </CardBody>
                </Card>
              );
            }
            return acc;
          }, [])}

          <div className="flex justify-end pt-4">
            <Button
              disabled={saving || loading}
              onClick={updateAttendance}
              icon={Save}
              className="w-full md:w-auto"
            >
              {saving ? "Updating..." : "Update Attendance"}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center text-ink-500">
          <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-ink-300" />
          <p className="font-medium text-ink-700">Please select Class, Term, and Academic Year</p>
          <p className="text-xs text-ink-400 mt-1">Select all filters above to load the attendance register.</p>
        </Card>
      )}
    </div>
  );
};

export default AttendanceRegister;

