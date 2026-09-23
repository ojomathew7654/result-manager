"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";
import { useSonner } from "@/lib/useSonner";
import { Save, Filter, BookOpen, Users, AlertCircle } from "lucide-react";

const Class = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [userSubjects, setUserSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const router = useRouter();
  const [updatedScores, setUpdatedScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const { data: session } = useSession();
  const [termType, setTermType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [input, setInput] = useState([]);
  const { customSonner } = useSonner();

  useEffect(() => {
    setUserClasses(session?.classes || []);
    setUserSubjects(session?.subjects || []);
  }, [router, session]);

  const fetchStudentData = async (term, cls, yr) => {
    if (!term || !cls || !yr || !session?.subjects?.length) return;

    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/student/class/result/${term}-${session.schoolId}-${encodeURIComponent(yr)}-${cls}`
      );
      const res = await axios.get(`/api/school/${session.schoolId}`);
      setInput(res.data.input || []);
      setSchoolName(res.data.name || "");

      const transformedData = data.map((student) => {
        const currentTerm = student.terms.find(
          (t) => t.termType === term
        );
        return { ...student, currentTerm };
      });

      setStudents(transformedData);

      if (transformedData.length > 0) {
        const filteredSubjects = Array.from(
          new Set(
            transformedData.flatMap(
              (student) =>
                student.currentTerm?.subjects
                  ?.filter((subject) =>
                    (session?.subjects || []).includes(subject.subjectName)
                  )
                  .map((subject) => subject.subjectName) || []
            )
          )
        );
        setAvailableSubjects(filteredSubjects);
      } else {
        setAvailableSubjects([]);
      }

      setSelectedSubject("");
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
      customSonner({ type: "error", text: "Failed to fetch student data." });
    }
    setLoading(false);
  };

  const handleTermChange = async (event) => {
    const val = event.target.value;
    setTermType(val);
    await fetchStudentData(val, selectedClass, academicYear);
  };

  const handleClassChange = async (e) => {
    const val = e.target.value;
    setSelectedClass(val);
    await fetchStudentData(termType, val, academicYear);
  };

  const handleAcademicYearChange = async (event) => {
    const val = event.target.value;
    setAcademicYear(val);
    await fetchStudentData(termType, selectedClass, val);
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
    if (!selectedClass || !selectedSubject || !termType) {
      customSonner({ type: "error", text: "Please select Class, Term, and Subject before saving." });
      return;
    }
    setLoading(true);
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
      customSonner({ type: "success", text: data.message || "Scores updated successfully!" });
    } catch (error) {
      console.error("Failed to update scores:", error);
      customSonner({ type: "error", text: "Failed to update scores. Please try again later." });
    }
    setLoading(false);
  };

  const calculateTotal = (student, subject) => {
    const updatedSubjectScores = updatedScores[student.id]?.[subject] || {};
    const existingSubjectScores =
      student.currentTerm?.subjects.find(
        (sub) => sub.subjectName === subject
      ) || {};

    const scores = {
      ...existingSubjectScores,
      ...updatedSubjectScores,
    };

    return input.reduce((acc, scoreType) => {
      return acc + (parseFloat(scores[scoreType]) || 0);
    }, 0);
  };

  const sortedStudents = [...students].sort((a, b) => {
    const surnameA = (a.surname || "").toLowerCase().trim();
    const surnameB = (b.surname || "").toLowerCase().trim();
    return surnameA.localeCompare(surnameB);
  });

  const isSSLevel = sortedStudents[0]?.level?.toLowerCase().startsWith("ss");
  const showRt = (schoolName !== "THE UKP SCHOOLS" && input.includes("rt")) ||
    (schoolName === "THE UKP SCHOOLS" && input.includes("rt") && !isSSLevel);
  const showNote = (schoolName !== "THE UKP SCHOOLS" && input.includes("note")) ||
    (schoolName === "THE UKP SCHOOLS" && input.includes("note") && !isSSLevel);
  const showAffective = (schoolName !== "THE UKP SCHOOLS" && input.includes("affective")) ||
    (schoolName === "THE UKP SCHOOLS" && input.includes("affective") && !isSSLevel);

  return (
    <div className="space-y-6">
      {/* Filter Options Card */}
      <Card>
        <CardHeader
          title="Selection & Filters"
          subtitle="Choose academic year, term, class, and subject to begin entering scores."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Academic Year" htmlFor="academicYear">
            <Select
              id="academicYear"
              value={academicYear}
              onChange={handleAcademicYearChange}
            >
              <option value="" disabled>
                Select academic year
              </option>
              <option value="2025/2026">2025/2026</option>
            </Select>
          </Field>

          <Field label="Term" htmlFor="term">
            <Select
              id="term"
              value={termType}
              onChange={handleTermChange}
            >
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
              <option value="">Select class</option>
              {userClasses?.map((classItem) => (
                <option key={classItem} value={classItem}>
                  {classItem}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Subject" htmlFor="subjectSelect">
            <Select
              id="subjectSelect"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={loading || !availableSubjects.length}
            >
              <option value="" disabled>
                {loading ? "Please wait..." : "Select Subject"}
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

      {/* Score Entry Table Card */}
      {selectedClass && (
        <Card>
          {!selectedSubject ? (
            <CardBody className="flex min-h-[200px] flex-col items-center justify-center text-center p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
                <BookOpen size={24} />
              </div>
              <h3 className="font-medium text-ink-900 text-base">Select a Subject</h3>
              <p className="text-sm text-ink-400 mt-1 max-w-sm">
                Choose a subject from the filters above to view and record student assessment scores.
              </p>
            </CardBody>
          ) : (
            <>
              <CardHeader
                title={`${selectedSubject} — Score Sheet`}
                subtitle={`Class: ${selectedClass} | Term: ${termType || "-"} | Students: ${sortedStudents.length}`}
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-ink-100 bg-ink-50 text-ink-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-3 w-10 text-center">#</th>
                        <th className="px-3 py-3 min-w-[120px]">Surname</th>
                        <th className="px-3 py-3 min-w-[120px]">Name</th>
                        {showRt && <th className="px-2 py-3 w-16 text-center">R.T</th>}
                        {input.includes("firstCA") && <th className="px-2 py-3 w-16 text-center">CA 1</th>}
                        {input.includes("secondCA") && <th className="px-2 py-3 w-16 text-center">CA 2</th>}
                        {input.includes("thirdCA") && <th className="px-2 py-3 w-16 text-center">CA 3</th>}
                        {input.includes("fourthCA") && <th className="px-2 py-3 w-16 text-center">CA 4</th>}
                        {input.includes("fifthCA") && <th className="px-2 py-3 w-16 text-center">CA 5</th>}
                        {input.includes("sixthCA") && <th className="px-2 py-3 w-16 text-center">CA 6</th>}
                        {input.includes("assignment") && <th className="px-2 py-3 w-16 text-center">Ass</th>}
                        {showNote && <th className="px-2 py-3 w-16 text-center">Note</th>}
                        {showAffective && <th className="px-2 py-3 w-16 text-center">Affective</th>}
                        {input.includes("project") && <th className="px-2 py-3 w-16 text-center">Proj</th>}
                        {input.includes("exam") && <th className="px-2 py-3 w-16 text-center">Exam</th>}
                        <th className="px-3 py-3 w-20 text-center font-bold text-ink-900 bg-ink-100/50">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100 bg-white">
                      {sortedStudents.map((student, index) => {
                        const subject =
                          student.currentTerm?.subjects.find(
                            (sub) => sub.subjectName === selectedSubject
                          ) || {};

                        const renderScoreInput = (scoreType, defaultValue) => {
                          const val =
                            updatedScores[student.id]?.[selectedSubject]?.[scoreType] ??
                            defaultValue ??
                            "";
                          return (
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className="w-14 rounded-md border border-ink-200 px-2 py-1 text-center text-xs text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                              value={val}
                              onChange={(e) =>
                                handleScoreChange(
                                  student.id,
                                  selectedSubject,
                                  scoreType,
                                  e.target.value
                                )
                              }
                            />
                          );
                        };

                        return (
                          <tr key={student.id} className="hover:bg-ink-50/50 transition-colors">
                            <td className="px-3 py-2 text-center text-ink-400 font-medium">{index + 1}</td>
                            <td className="px-3 py-2 font-medium text-ink-900">{student.surname}</td>
                            <td className="px-3 py-2 text-ink-700">{student.name}</td>

                            {showRt && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("rt", subject.rt)}
                              </td>
                            )}

                            {input.includes("firstCA") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("firstCA", subject.firstCA)}
                              </td>
                            )}

                            {input.includes("secondCA") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("secondCA", subject.secondCA)}
                              </td>
                            )}

                            {input.includes("thirdCA") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("thirdCA", subject.thirdCA)}
                              </td>
                            )}

                            {input.includes("fourthCA") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("fourthCA", subject.fourthCA)}
                              </td>
                            )}

                            {input.includes("fifthCA") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("fifthCA", subject.fifthCA)}
                              </td>
                            )}

                            {input.includes("sixthCA") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("sixthCA", subject.sixthCA)}
                              </td>
                            )}

                            {input.includes("assignment") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("assignment", subject.assignment)}
                              </td>
                            )}

                            {showNote && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("note", subject.note)}
                              </td>
                            )}

                            {showAffective && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("affective", subject.affective)}
                              </td>
                            )}

                            {input.includes("project") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("project", subject.project)}
                              </td>
                            )}

                            {input.includes("exam") && (
                              <td className="px-2 py-2 text-center">
                                {renderScoreInput("exam", subject.exam)}
                              </td>
                            )}

                            <td className="px-3 py-2 text-center font-bold text-brand-700 bg-brand-50/30 text-sm">
                              {calculateTotal(student, selectedSubject)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-ink-100 bg-ink-50/50 p-4">
                  <Button
                    type="button"
                    onClick={handleUpdateScores}
                    disabled={loading}
                    icon={Save}
                  >
                    {loading ? "Saving Scores..." : "Save Scores"}
                  </Button>
                </div>
              </CardBody>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default Class;
