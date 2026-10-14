"use client";
import React, { useEffect, useState } from "react";
import styles from "./check-result.module.css";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";

const Class = () => {
  const [students, setStudents] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [updatedScores, setUpdatedScores] = useState({});
  const [input, setInput] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [termType, setTermType] = useState("");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        console.log(data);
        setSchoolClasses(data.classes.sort() || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        redirect("/");
      }
    }
  }, [sessionStatus, session]);
  if (sessionStatus == "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    const encodedAcademicYear = encodeURIComponent(academicYear);
    if (!termType || !selectedClass || !academicYear) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/student/class/result/${termType}-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`,
      );
      const res = await axios.get(`/api/school/${session.schoolId}`);
      setSchoolName(res.data.name);
      setInput(res.data.input);
      const transformedData = transformData(data, termType);
      setStudents(transformedData);
      setSelectedSubject("");
      const availableSubjects = Array.from(
        new Set(
          transformedData.flatMap(
            (student) =>
              student.currentTerm?.map((subject) => subject.subjectName) || [],
          ),
        ),
      );
      const sortedSubjects = availableSubjects ? availableSubjects.sort() : [];
      setAvailableSubjects(sortedSubjects);
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const transformData = (data, termType) => {
    return data.map((student) => {
      const term = student.terms.find((term) => term.termType === termType);
      student.currentTerm = term ? term.subjects : [];
      return student;
    });
  };
  const handleTermChange = async (event) => {
    const termType = event.target.value;
    setTermType(termType);
    await fetchStudentData(termType, selectedClass, academicYear);
  };

  const handleClassChange = async (e) => {
    const selectedClass = e.target.value;
    setSelectedClass(selectedClass);
    await fetchStudentData(termType, selectedClass, academicYear);
  };

  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
    await fetchStudentData(termType, selectedClass, academicYear);
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
    setLoading(true);
    try {
      const records = [];
      for (const studentId of Object.keys(updatedScores)) {
        const record = {
          subjectName: selectedSubject,
          scores: updatedScores[studentId][selectedSubject],
        };
        records.push({ studentId, record });
      }
      const { data } = await axios.patch(
        `/api/student/class/${selectedClass}`,
        { termType, records },
      );
      alert(data.message);
    } catch (error) {
      alert("Network Error. Please try again later.");
      console.error("Failed to update scores:", error.message);
    }
    setLoading(false);
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
      0,
    );

    return total;
  };
  students?.sort((a, b) => {
    if (a.surname.toLowerCase() < b.surname.toLowerCase()) {
      return -1;
    }
    if (a.surname.toLowerCase() > b.surname.toLowerCase()) {
      return 1;
    }
    return 0;
  });

  return (
    <div className={styles.checkResult}>
      <h1>Please select academic year, term, class, and subject.</h1>
      <div className={styles.selectContainer}>
        <select
          id="academicYearSelect"
          value={academicYear}
          onChange={handleAcademicYearChange}
        >
          <option value="" disabled>
            Select academic year
          </option>
          <option value="2025/2026">2025/2026</option>
          <option value="2026/2027">2026/2027</option>
        </select>
        <select id="termSelect" value={termType} onChange={handleTermChange}>
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>
        <select value={selectedClass} onChange={handleClassChange}>
          <option value="" disabled>
            Select class
          </option>
          {schoolClasses.map((classItem) => (
            <option key={classItem} value={classItem}>
              {classItem.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          id="subjects"
          onChange={(e) => setSelectedSubject(e.target.value)}
          value={selectedSubject}
        >
          <option value="" disabled>
            {loading ? "Please wait..." : "Select Subject"}
          </option>
          {availableSubjects.map((subjectName, index) => (
            <option key={index} value={subjectName}>
              {subjectName}
            </option>
          ))}
        </select>
      </div>
      {selectedClass && (
        <div className={styles.tableContainer}>
          {selectedSubject && (
            <div>
              <table border={1}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Surname</th>
                    <th>Name</th>

                    {(schoolName !== "THE UKP SCHOOLS" &&
                      input.includes("rt")) ||
                    (schoolName === "THE UKP SCHOOLS" &&
                      input.includes("rt") &&
                      !students[0]?.level.startsWith("ss")) ? (
                      <th>R. T</th>
                    ) : null}

                    {input.includes("firstCA") && <th>CA 1</th>}
                    {input.includes("secondCA") && <th>CA 2</th>}

                    {input.includes("thirdCA") && <th>CA 3</th>}
                    {input.includes("fourthCA") && <th>CA 4</th>}
                    {input.includes("fifthCA") && <th>CA 5</th>}
                    {input.includes("sixthCA") && <th>CA 6</th>}
                    {input.includes("assignment") && <th>Ass</th>}
                    {input.includes("project") && <th>Proj</th>}

                    {(schoolName !== "THE UKP SCHOOLS" &&
                      input.includes("affective")) ||
                    (schoolName === "THE UKP SCHOOLS" &&
                      input.includes("affective") &&
                      !students[0]?.level.startsWith("ss")) ? (
                      <th>Affective</th>
                    ) : null}
                    {(schoolName !== "THE UKP SCHOOLS" &&
                      input.includes("note")) ||
                    (schoolName === "THE UKP SCHOOLS" &&
                      input.includes("note") &&
                      !students[0]?.level.startsWith("ss")) ? (
                      <th>Note</th>
                    ) : null}

                    {input.includes("exam") && <th>Exam</th>}

                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.surname}</td>
                      <td>{student.name}</td>

                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("rt")) ||
                        (schoolName === "THE UKP SCHOOLS" &&
                          input.includes("rt") &&
                          !students[0]?.level.startsWith("ss") && (
                            <td>
                              <input
                                type="number"
                                value={
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["rt"] ??
                                  student.currentTerm?.find(
                                    (subject) =>
                                      subject.subjectName === selectedSubject,
                                  )?.rt ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    student.id,
                                    selectedSubject,
                                    "rt",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                          ))}

                      {input.includes("firstCA") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "firstCA"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.firstCA ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "firstCA",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}

                      {input.includes("secondCA") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "secondCA"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.secondCA ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "secondCA",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}
                      {input.includes("thirdCA") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "thirdCA"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.thirdCA ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "thirdCA",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}
                      {input.includes("fourthCA") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "fourthCA"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.fourthCA ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "fourthCA",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}
                      {input.includes("fifthCA") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "fifthCA"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.fifthCA ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "fifthCA",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}
                      {input.includes("sixthCA") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "sixthCA"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.sixthCA ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "sixthCA",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}
                      {input.includes("assignment") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "assignment"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.assignment ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "assignment",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}
                      {input.includes("project") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "project"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.project ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "project",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}

                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("affective")) ||
                      (schoolName === "THE UKP SCHOOLS" &&
                        input.includes("affective") &&
                        !students[0]?.level.startsWith("ss")) ? (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "affective"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.affective ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "affective",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      ) : null}

                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("note")) ||
                      (schoolName === "THE UKP SCHOOLS" &&
                        input.includes("note") &&
                        !students[0]?.level.startsWith("ss")) ? (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "note"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.note ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "note",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      ) : null}

                      {input.includes("exam") && (
                        <td>
                          <input
                            type="number"
                            value={
                              updatedScores[student.id]?.[selectedSubject]?.[
                                "exam"
                              ] ??
                              student.currentTerm?.find(
                                (subject) =>
                                  subject.subjectName === selectedSubject,
                              )?.exam ??
                              ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                selectedSubject,
                                "exam",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      )}
                      <td className={styles.total}>
                        {calculateTotal(student, selectedSubject)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={handleUpdateScores}
                className={loading && styles.disabled}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Scores"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Class;
