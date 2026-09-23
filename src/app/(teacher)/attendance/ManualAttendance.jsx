"use client";

import React, { useState } from "react";
import axios from "axios";
import { Save, Calendar, Users, GraduationCap, CheckCircle2 } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";
import { useSonner } from "@/lib/useSonner";

const ManualAttendance = ({ session }) => {
  const { customSonner } = useSonner();
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [termType, setTermType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStudentData = async (term, level, year) => {
    if (!term || !level || !year) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(year);
      const { data } = await axios.get(
        `/api/student/class/${term}-${session.schoolId}-${encodedAcademicYear}-${level}`
      );

      setStudents(data || []);
      const initialAttendanceData = {};
      (data || []).forEach((student) => {
        const attendance = student.attendanceList?.find(
          (item) => item.termType === term && item.session === year
        );
        if (attendance) {
          initialAttendanceData[student.id] = {
            schoolOpenDays: attendance.schoolOpenDays,
            daysAbsent: attendance.daysAbsent,
            daysPresent: attendance.daysPresent,
          };
        }
      });
      setAttendanceData(initialAttendanceData);
    } catch (err) {
      console.error(err);
      customSonner({ type: "error", text: "Error fetching student attendance data." });
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    const year = event.target.value;
    setAcademicYear(year);
    await fetchStudentData(termType, selectedClass, year);
  };

  const handleTermChange = async (event) => {
    const term = event.target.value;
    setTermType(term);
    await fetchStudentData(term, selectedClass, academicYear);
  };

  const handleClassChange = async (e) => {
    const level = e.target.value;
    setSelectedClass(level);
    await fetchStudentData(termType, level, academicYear);
  };

  const handleInputChange = (studentId, field, value) => {
    setAttendanceData((prevData) => ({
      ...prevData,
      [studentId]: {
        ...prevData[studentId],
        [field]: value,
      },
    }));
  };

  const submitAttendance = async () => {
    if (!academicYear || !selectedClass || !termType) {
      customSonner({ type: "error", text: "Please select Academic Year, Class, and Term." });
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        students.map((student) =>
          axios.post(`/api/student/attendance`, {
            studentId: student.id,
            termType,
            session: academicYear,
            schoolOpenDays: attendanceData[student.id]?.schoolOpenDays || 0,
            daysAbsent: attendanceData[student.id]?.daysAbsent || 0,
            daysPresent: attendanceData[student.id]?.daysPresent || 0,
          })
        )
      );
      customSonner({ type: "success", text: "Attendance submitted successfully." });
    } catch (error) {
      console.error("Failed to submit attendance", error);
      customSonner({ type: "error", text: "There was an error submitting the attendance." });
    } finally {
      setLoading(false);
    }
  };

  // Sort students alphabetically by surname
  const sortedStudents = [...students].sort((a, b) => {
    const surnameA = (a.surname || "").toLowerCase().trim();
    const surnameB = (b.surname || "").toLowerCase().trim();
    return surnameA.localeCompare(surnameB);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Attendance Register"
        subtitle="Select academic year, class, and term to record school open days and attendance counts."
      />

      {/* Filter Selection Card */}
      <Card>
        <CardHeader
          title="Attendance Selection Filters"
          subtitle="Choose class placement and academic term"
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Academic Year" required>
              <Select value={academicYear} onChange={handleAcademicYearChange}>
                <option value="" disabled>
                  Select academic year
                </option>
                <option value="2025/2026">2025/2026</option>
              </Select>
            </Field>

            <Field label="Class" required>
              <Select value={selectedClass} onChange={handleClassChange}>
                <option value="">Select class</option>
                {session?.teacherOf?.map((classItem) => (
                  <option key={classItem} value={classItem}>
                    {classItem.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Term" required>
              <Select value={termType} onChange={handleTermChange}>
                <option value="" disabled>
                  Select Term
                </option>
                <option value="FIRST">First Term</option>
                <option value="SECOND">Second Term</option>
                <option value="THIRD">Third Term</option>
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      {loading && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
          <Spinner />
          <p className="text-sm text-ink-500">Loading student attendance roster...</p>
        </div>
      )}

      {/* Attendance Table Card */}
      {!loading && termType && academicYear && selectedClass && (
        <Card>
          <CardHeader
            title={`Attendance Register (${sortedStudents.length} Students)`}
            subtitle={`Class: ${selectedClass.toUpperCase()} | Term: ${termType} | Year: ${academicYear}`}
            action={
              <Button
                onClick={submitAttendance}
                disabled={loading || sortedStudents.length === 0}
                variant="primary"
                icon={Save}
              >
                {loading ? "Saving..." : "Update Attendance"}
              </Button>
            }
          />
          <CardBody className="space-y-4">
            {sortedStudents.length === 0 ? (
              <div className="py-8 text-center text-ink-400">
                <Users className="mx-auto mb-2 h-8 w-8 text-ink-300" />
                <p className="text-sm">No students found in this class.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-ink-100">
                <table className="w-full text-left text-sm text-ink-700">
                  <thead className="bg-ink-50 text-xs uppercase font-semibold text-ink-600 border-b border-ink-100">
                    <tr>
                      <th className="px-3 py-3 w-12 text-center">No</th>
                      <th className="px-3 py-3">Surname</th>
                      <th className="px-3 py-3">First Name</th>
                      <th className="px-3 py-3 w-36">School Open Days</th>
                      <th className="px-3 py-3 w-36">Days Present</th>
                      <th className="px-3 py-3 w-36">Days Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 bg-white">
                    {sortedStudents.map((student, index) => (
                      <tr key={student.id} className="hover:bg-ink-50/50 transition-colors">
                        <td className="px-3 py-2 text-center font-medium text-ink-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 font-medium text-ink-900 uppercase">
                          {student.surname}
                        </td>
                        <td className="px-3 py-2 text-ink-800">
                          {student.name}
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={attendanceData[student.id]?.schoolOpenDays || ""}
                            onChange={(e) =>
                              handleInputChange(
                                student.id,
                                "schoolOpenDays",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            min="0"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={attendanceData[student.id]?.daysPresent || ""}
                            onChange={(e) =>
                              handleInputChange(
                                student.id,
                                "daysPresent",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            min="0"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={attendanceData[student.id]?.daysAbsent || ""}
                            onChange={(e) =>
                              handleInputChange(
                                student.id,
                                "daysAbsent",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {sortedStudents.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={submitAttendance}
                  disabled={loading}
                  variant="primary"
                  icon={Save}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {loading ? "Updating Attendance..." : "Update Attendance"}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ManualAttendance;
