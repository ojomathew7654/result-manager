"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ArrowLeft, Save, FileEdit } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

const Class = () => {
  const [students, setStudents] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [updatedScores, setUpdatedScores] = useState({});
  const [input, setInput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [termType, setTermType] = useState("");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchoolClasses(data.classes ? [...data.classes].sort() : []);
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

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500">
        <Spinner /> Please wait...
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    if (!termType || !selectedClass || !academicYear) return;
    const encodedAcademicYear = encodeURIComponent(academicYear);
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/student/class/result/${termType}-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`
      );
      const res = await axios.get(`/api/school/${session.schoolId}`);
      setSchoolName(res.data.name);
      setInput(res.data.input || []);
      const transformedData = transformData(data, termType);
      setStudents(transformedData);
      setSelectedSubject("");
      const availableSubjs = Array.from(
        new Set(
          transformedData.flatMap(
            (student) =>
              student.currentTerm?.map((subject) => subject.subjectName) || []
          )
        )
      );
      const sortedSubjects = availableSubjs ? availableSubjs.sort() : [];
      setAvailableSubjects(sortedSubjects);
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const transformData = (data, termType) => {
    return data.map((student) => {
      const term = student.terms?.find((t) => t.termType === termType);
      student.currentTerm = term ? term.subjects : [];
      return student;
    });
  };

  const handleTermChange = async (event) => {
    const termValue = event.target.value;
    setTermType(termValue);
    await fetchStudentData(termValue, selectedClass, academicYear);
  };

  const handleClassChange = async (e) => {
    const classValue = e.target.value;
    setSelectedClass(classValue);
    await fetchStudentData(termType, classValue, academicYear);
  };

  const handleAcademicYearChange = async (event) => {
    const yearValue = event.target.value;
    setAcademicYear(yearValue);
    await fetchStudentData(termType, selectedClass, yearValue);
  };

  const handleScoreChange = (studentId, subjectName, scoreType, value) => {
    setUpdatedScores((prevState) => ({
      ...prevState,
      [studentId]: {
        ...prevState[studentId],
        [subjectName]: {
          ...prevState[studentId]?.[subjectName],
          [scoreType]: parseFloat(value) || 0,
        },
      },
    }));
  };

  const handleUpdateScores = async () => {
    if (!selectedSubject) {
      alert("Please select a subject.");
      return;
    }
    setUpdating(true);
    try {
      const records = [];
      for (const studentId of Object.keys(updatedScores)) {
        if (updatedScores[studentId]?.[selectedSubject]) {
          const record = {
            subjectName: selectedSubject,
            scores: updatedScores[studentId][selectedSubject],
          };
          records.push({ studentId, record });
        }
      }
      const { data } = await axios.patch(
        `/api/student/class/${selectedClass}`,
        { termType, records }
      );
      alert(data.message || "Scores updated successfully.");
    } catch (error) {
      alert("Network Error. Please try again later.");
      console.error("Failed to update scores:", error.message);
    } finally {
      setUpdating(false);
    }
  };

  const calculateTotal = (student, subject) => {
    const updatedSubjectScores = updatedScores[student.id]?.[subject] || {};
    const existingSubjectScores =
      student.currentTerm?.find((sub) => sub.subjectName === subject) || {};

    const scores = {
      ...existingSubjectScores,
      ...updatedSubjectScores,
    };

    const total = input.reduce(
      (acc, key) => acc + (parseFloat(scores[key]) || 0),
      0
    );

    return total;
  };

  const sortedStudents = [...students].sort((a, b) => {
    const nameA = (a.surname || "").toLowerCase();
    const nameB = (b.surname || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div>
      <PageHeader
        title="Manage Results"
        subtitle="Enter and update continuous assessment and exam scores for students."
        action={
          <Button as={Link} href="/admin" variant="outline" icon={ArrowLeft}>
            Dashboard
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <Field label="Class" htmlFor="classSelect">
            <Select
              id="classSelect"
              value={selectedClass}
              onChange={handleClassChange}
            >
              <option value="" disabled>
                Select class
              </option>
              {schoolClasses.map((classItem) => (
                <option key={classItem} value={classItem}>
                  {classItem.toUpperCase()}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Subject" htmlFor="subjectSelect">
            <Select
              id="subjectSelect"
              onChange={(e) => setSelectedSubject(e.target.value)}
              value={selectedSubject}
            >
              <option value="" disabled>
                {loading ? "Loading..." : "Select Subject"}
              </option>
              {availableSubjects.map((subjectName, index) => (
                <option key={index} value={subjectName}>
                  {subjectName}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {selectedClass ? (
        selectedSubject ? (
          <div className="space-y-6">
            <Card>
              <CardBody className="overflow-x-auto p-0">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Surname</th>
                      <th className="px-4 py-3">Name</th>

                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("rt")) ||
                      (schoolName === "THE UKP SCHOOLS" &&
                        input.includes("rt") &&
                        !sortedStudents[0]?.level?.startsWith("ss")) ? (
                        <th className="px-3 py-3 text-center">R. T</th>
                      ) : null}

                      {input.includes("firstCA") && <th className="px-3 py-3 text-center">CA 1</th>}
                      {input.includes("secondCA") && <th className="px-3 py-3 text-center">CA 2</th>}
                      {input.includes("thirdCA") && <th className="px-3 py-3 text-center">CA 3</th>}
                      {input.includes("fourthCA") && <th className="px-3 py-3 text-center">CA 4</th>}
                      {input.includes("fifthCA") && <th className="px-3 py-3 text-center">CA 5</th>}
                      {input.includes("sixthCA") && <th className="px-3 py-3 text-center">CA 6</th>}
                      {input.includes("assignment") && <th className="px-3 py-3 text-center">Ass</th>}
                      {input.includes("project") && <th className="px-3 py-3 text-center">Proj</th>}

                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("affective")) ||
                      (schoolName === "THE UKP SCHOOLS" &&
                        input.includes("affective") &&
                        !sortedStudents[0]?.level?.startsWith("ss")) ? (
                        <th className="px-3 py-3 text-center">Affective</th>
                      ) : null}

                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("note")) ||
                      (schoolName === "THE UKP SCHOOLS" &&
                        input.includes("note") &&
                        !sortedStudents[0]?.level?.startsWith("ss")) ? (
                        <th className="px-3 py-3 text-center">Note</th>
                      ) : null}

                      {input.includes("exam") && <th className="px-3 py-3 text-center">Exam</th>}

                      <th className="px-4 py-3 text-center">Total</th>
                    </tr>
                  </thead>
                  {loading ? (
                    <tbody>
                      <tr>
                        <td colSpan="15" className="px-5 py-10 text-center text-ink-400">
                          Loading student scores...
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody className="divide-y divide-ink-100">
                      {sortedStudents.map((student, index) => (
                        <tr key={student.id} className="hover:bg-ink-50/60">
                          <td className="px-4 py-3 text-ink-500">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-ink-900">{student.surname}</td>
                          <td className="px-4 py-3 font-medium text-ink-900">{student.name}</td>

                          {(schoolName !== "THE UKP SCHOOLS" &&
                            input.includes("rt")) ||
                          (schoolName === "THE UKP SCHOOLS" &&
                            input.includes("rt") &&
                            !sortedStudents[0]?.level?.startsWith("ss")) ? (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["rt"] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.rt ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "rt",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          ) : null}

                          {input.includes("firstCA") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "firstCA"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.firstCA ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "firstCA",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {input.includes("secondCA") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "secondCA"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.secondCA ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "secondCA",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {input.includes("thirdCA") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "thirdCA"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.thirdCA ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "thirdCA",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {input.includes("fourthCA") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "fourthCA"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.fourthCA ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "fourthCA",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {input.includes("fifthCA") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "fifthCA"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.fifthCA ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "fifthCA",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {input.includes("sixthCA") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "sixthCA"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.sixthCA ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "sixthCA",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {input.includes("assignment") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "assignment"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.assignment ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "assignment",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {input.includes("project") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "project"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.project ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "project",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          {(schoolName !== "THE UKP SCHOOLS" &&
                            input.includes("affective")) ||
                          (schoolName === "THE UKP SCHOOLS" &&
                            input.includes("affective") &&
                            !sortedStudents[0]?.level?.startsWith("ss")) ? (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "affective"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.affective ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "affective",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          ) : null}

                          {(schoolName !== "THE UKP SCHOOLS" &&
                            input.includes("note")) ||
                          (schoolName === "THE UKP SCHOOLS" &&
                            input.includes("note") &&
                            !sortedStudents[0]?.level?.startsWith("ss")) ? (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "note"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.note ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "note",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          ) : null}

                          {input.includes("exam") && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={
                                  updatedScores[student.id]?.[selectedSubject]?.[
                                    "exam"
                                  ] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject
                                  )?.exam ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "exam",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          )}

                          <td className="px-4 py-3 text-center font-bold text-brand-700">
                            {calculateTotal(student, selectedSubject)}
                          </td>
                        </tr>
                      ))}
                      {!sortedStudents.length && (
                        <tr>
                          <td colSpan="15" className="px-5 py-10 text-center text-ink-400">
                            No students found for this selection.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  )}
                </table>
              </CardBody>
            </Card>

            <div className="flex justify-end">
              <Button
                disabled={updating || loading}
                onClick={handleUpdateScores}
                icon={Save}
                className="w-full sm:w-auto"
              >
                {updating ? "Updating..." : "Update Scores"}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center text-ink-500">
            <FileEdit className="mx-auto mb-3 h-10 w-10 text-ink-300" />
            <p className="font-medium text-ink-700">Select a Subject</p>
            <p className="mt-1 text-xs text-ink-400">
              Please choose a subject from the filter dropdown above to display the score sheet.
            </p>
          </Card>
        )
      ) : (
        <Card className="p-8 text-center text-ink-500">
          <FileEdit className="mx-auto mb-3 h-10 w-10 text-ink-300" />
          <p className="font-medium text-ink-700">Select Class, Term, and Academic Year</p>
          <p className="mt-1 text-xs text-ink-400">
            Select academic year, term, and class above to load available subjects and student rosters.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Class;

