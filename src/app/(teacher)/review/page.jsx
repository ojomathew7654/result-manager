"use client";

import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import { Eye } from "lucide-react";

function formatHeader(header) {
  return header
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const ReviewResult = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const fetchStudentData = async (cls, yr, term) => {
    if (!cls || !yr || !term || !session?.schoolId) return;

    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/result/review?selectedClass=${cls}&schoolId=${session.schoolId}&academicYear=${yr}&selectedTerm=${term}`
      );
      setStudents(data || []);
    } catch (err) {
      console.error("Error fetching student data:", err);
    }
    setLoading(false);
  };

  const handleTermChange = async (e) => {
    const term = e.target.value;
    setSelectedTerm(term);
    await fetchStudentData(selectedClass, academicYear, term);
  };

  const handleAcademicYearChange = async (event) => {
    const yr = event.target.value;
    setAcademicYear(yr);
    await fetchStudentData(selectedClass, yr, selectedTerm);
  };

  const handleClassChange = async (e) => {
    const cls = e.target.value;
    setSelectedClass(cls);
    await fetchStudentData(cls, academicYear, selectedTerm);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-white">
        <Spinner />
        <p className="text-sm font-medium text-ink-300">Loading student reviews...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Student Results"
        subtitle="Inspect comprehensive student academic records, teacher remarks, and subject scores."
      />

      {/* Filter Card */}
      <Card>
        <CardHeader
          title="Selection Filters"
          subtitle="Choose academic year, class, and term to load student review cards."
        />
        <CardBody className="grid gap-4 sm:grid-cols-3">
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

          <Field label="Term" htmlFor="termSelect">
            <Select id="termSelect" value={selectedTerm} onChange={handleTermChange}>
              <option value="">Select term</option>
              <option value="FIRST">First Term</option>
              <option value="SECOND">Second Term</option>
              <option value="THIRD">Third Term</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex min-h-[200px] flex-col items-center justify-center text-white">
          <Spinner />
          <p className="text-sm font-medium text-ink-300 mt-3">Fetching student result details...</p>
        </div>
      )}

      {/* Students Count Header */}
      {!loading && students.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white uppercase">
            {(students[0]?.level || "").toUpperCase()} — ({students.length}) Students
          </h2>
        </div>
      )}

      {/* Empty State */}
      {!loading && selectedClass && selectedTerm && academicYear && students.length === 0 && (
        <Card>
          <CardBody className="flex min-h-[200px] flex-col items-center justify-center text-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
              <Eye size={24} />
            </div>
            <h3 className="font-medium text-ink-900 text-base">No Student Records Found</h3>
            <p className="text-sm text-ink-400 mt-1 max-w-sm">
              No results were found matching the selected class, term, and academic year.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Student Result Cards */}
      {!loading &&
        students.map((student) => (
          <Card key={student.id} className="overflow-hidden">
            <CardHeader
              title={`Student: ${student.name || ""} ${student.surname || ""}`}
              subtitle={`Level: ${(student.level || "").toUpperCase()} | Gender: ${student.gender || "-"} | Age: ${student.age || "-"}`}
            />
            <CardBody className="space-y-6">
              {/* Remarks Summary Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                  Evaluation Remarks
                </h4>
                <div className="overflow-x-auto rounded-xl border border-ink-100">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-ink-50 text-ink-500 font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Gender</th>
                        <th className="px-3 py-2.5">Age</th>
                        <th className="px-3 py-2.5">Level</th>
                        <th className="px-3 py-2.5">Form Teacher</th>
                        <th className="px-3 py-2.5">Form Teacher Comments</th>
                        <th className="px-3 py-2.5">Head of School Comments</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-ink-100 text-ink-700">
                      <tr>
                        <td className="px-3 py-2.5">{student.gender || "-"}</td>
                        <td className="px-3 py-2.5">{student.age || "-"}</td>
                        <td className="px-3 py-2.5 uppercase font-medium">{student.level || "-"}</td>
                        <td className="px-3 py-2.5 font-medium text-ink-900">{student.formTeacherName || "-"}</td>
                        <td className="px-3 py-2.5 max-w-xs">{student.formTeacherRemark || "-"}</td>
                        <td className="px-3 py-2.5 max-w-xs">{student.headOfSchoolRemark || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Term Subject Tables */}
              {(student.terms || []).map((term) => {
                const keys = [
                  "subjectName",
                  ...Object.keys(term.subjects[0] || {}).filter(
                    (key) =>
                      key !== "id" &&
                      key !== "termId" &&
                      key !== "subjectName" &&
                      term.subjects.some(
                        (subject) =>
                          subject[key] !== null && subject[key] !== undefined
                      )
                  ),
                ];

                return (
                  <div key={term.id} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Term: {term.termType}
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-ink-100">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-ink-50 text-ink-500 font-semibold uppercase">
                          <tr>
                            <th className="px-3 py-2.5 w-10 text-center">#</th>
                            {keys.map((key) => (
                              <th key={key} className="px-3 py-2.5">
                                {key === "subjectName" ? "Subjects" : formatHeader(key)}
                              </th>
                            ))}
                            <th className="px-3 py-2.5 text-center font-bold text-ink-900 bg-brand-50/50">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-ink-100">
                          {term.subjects.map((subject, index) => {
                            const total = keys
                              .filter(
                                (key) =>
                                  typeof subject[key] === "number" ||
                                  subject[key] === null
                              )
                              .reduce((sum, key) => sum + (subject[key] || 0), 0);

                            return (
                              <tr key={subject.id} className="hover:bg-ink-50/50 transition-colors">
                                <td className="px-3 py-2 text-center text-ink-400 font-medium">{index + 1}</td>
                                {keys.map((key) => (
                                  <td key={key} className="px-3 py-2 text-ink-700">
                                    {subject[key] !== null && subject[key] !== undefined
                                      ? subject[key]
                                      : 0}
                                  </td>
                                ))}
                                <td className="px-3 py-2 text-center font-bold text-brand-700 bg-brand-50/20">
                                  {total > 0 ? total : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        ))}
    </div>
  );
};

export default ReviewResult;
