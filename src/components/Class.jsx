"use client";
import React, { useEffect, useState } from "react";
import "./Class.css";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";

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
  const { data: session, status: sessionStatus } = useSession();
  const [termType, setTermType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [input, setInput] = useState([]);

  useEffect(() => {
    setUserClasses(session?.classes);
    setUserSubjects(session?.subjects);
  }, [router, session]);

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    if (!termType || !selectedClass || !academicYear || !userSubjects.length)
      return;

    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/student/class/result/${termType}-${
          session.schoolId
        }-${encodeURIComponent(academicYear)}-${selectedClass}`,
      );
      const res = await axios.get(`/api/school/${session.schoolId}`);
      setInput(res.data.input);
      setSchoolName(res.data.name);
      const transformedData = data.map((student) => {
        const currentTerm = student.terms.find(
          (term) => term.termType === termType,
        );
        return { ...student, currentTerm };
      });

      setStudents(transformedData);

      // Ensure transformedData and currentTerm subjects exist
      if (transformedData.length > 0) {
        const filteredSubjects = Array.from(
          new Set(
            transformedData.flatMap(
              (student) =>
                student.currentTerm?.subjects
                  ?.filter((subject) =>
                    userSubjects.includes(subject.subjectName),
                  )
                  .map((subject) => subject.subjectName) || [],
            ),
          ),
        );
        setAvailableSubjects(filteredSubjects);
      } else {
        setAvailableSubjects([]);
      }

      setSelectedSubject("");
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
    }
    setLoading(false);
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
      alert("Failed to update scores. Please try again later.");
    }
    setLoading(false);
  };

  const calculateTotal = (student, subject) => {
    const updatedSubjectScores = updatedScores[student.id]?.[subject] || {};
    const existingSubjectScores =
      student.currentTerm?.subjects.find(
        (sub) => sub.subjectName === subject,
      ) || {};

    const scores = {
      ...existingSubjectScores,
      ...updatedSubjectScores,
    };

    const total = input.reduce((acc, scoreType) => {
      return acc + (parseFloat(scores[scoreType]) || 0);
    }, 0);

    return total;
  };
  students?.sort((a, b) => {
    const surnameA = a.surname.toLowerCase().trim(); // Remove extra spaces
    const surnameB = b.surname.toLowerCase().trim(); // Remove extra spaces

    if (surnameA < surnameB) {
      return -1;
    }
    if (surnameA > surnameB) {
      return 1;
    }
    return 0;
  });

  return (
    <div className="eachClass-dashboard">
      <div className="selectContainer">
        <select
          id="academicYearSelect"
          value={academicYear}
          onChange={handleAcademicYearChange}
        >
          <option value="" disabled>
            Select academic year
          </option>
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
          <option value="">Select class</option>
          {userClasses?.map((classItem) => (
            <option key={classItem} value={classItem}>
              {classItem}
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
        <div className="tableContainer">
          {selectedSubject && (
            <div>
              <div className="tableContainer">
                <table border={3}>
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
                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("note")) ||
                      (schoolName === "THE UKP SCHOOLS" &&
                        input.includes("note") &&
                        !students[0]?.level.startsWith("ss")) ? (
                        <th>Note</th>
                      ) : null}
                      {(schoolName !== "THE UKP SCHOOLS" &&
                        input.includes("affective")) ||
                      (schoolName === "THE UKP SCHOOLS" &&
                        input.includes("affective") &&
                        !students[0]?.level.startsWith("ss")) ? (
                        <th>Affective</th>
                      ) : null}

                      {input.includes("project") && <th>Proj</th>}
                      {input.includes("exam") && <th>Exam</th>}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const subject =
                        student.currentTerm?.subjects.find(
                          (subject) => subject.subjectName === selectedSubject,
                        ) || {};

                      return (
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
                                      subject.rt ??
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
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["firstCA"] ??
                                  subject.firstCA ??
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
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["secondCA"] ??
                                  subject.secondCA ??
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
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["thirdCA"] ??
                                  subject.thirdCA ??
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
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["fourthCA"] ??
                                  subject.fourthCA ??
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
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["fifthCA"] ??
                                  subject.fifthCA ??
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
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["sixthCA"] ??
                                  subject.sixthCA ??
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
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["assignment"] ??
                                  subject.assignment ??
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

                          {(schoolName !== "THE UKP SCHOOLS" &&
                            input.includes("note")) ||
                          (schoolName === "THE UKP SCHOOLS" &&
                            input.includes("note") &&
                            !students[0]?.level.startsWith("ss")) ? (
                            <td>
                              <input
                                type="number"
                                value={
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["note"] ??
                                  subject.note ??
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

                          {(schoolName !== "THE UKP SCHOOLS" &&
                            input.includes("affective")) ||
                          (schoolName === "THE UKP SCHOOLS" &&
                            input.includes("affective") &&
                            !students[0]?.level.startsWith("ss")) ? (
                            <td>
                              <input
                                type="number"
                                value={
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["affective"] ??
                                  subject.affective ??
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

                          {input.includes("project") && (
                            <td>
                              <input
                                type="number"
                                value={
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["project"] ??
                                  subject.project ??
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

                          {input.includes("exam") && (
                            <td>
                              <input
                                type="number"
                                value={
                                  updatedScores[student.id]?.[
                                    selectedSubject
                                  ]?.["exam"] ??
                                  subject.exam ??
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

                          <td className="total">
                            {calculateTotal(student, selectedSubject)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="save-button-container">
                <button
                  className="updateScoresBtn"
                  onClick={handleUpdateScores}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Class;
