"use client";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./review.module.css";
import Spinner from "@/components/Spinner/Spinner";

const ReviewResult = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const fetchStudentData = async (
    selectedClass,
    academicYear,
    selectedTerm,
  ) => {
    if (!selectedClass || !academicYear || !selectedTerm || !session?.schoolId)
      return;

    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/result/review?selectedClass=${selectedClass}&schoolId=${session.schoolId}&academicYear=${academicYear}&selectedTerm=${selectedTerm}`,
      );
      console.log(data);
      setStudents(data);
    } catch (err) {
      console.error("Error fetching student data:", err);
    }
    setLoading(false);
  };
  const handleTermChange = async (e) => {
    const term = e.target.value; // Use a different variable name
    setSelectedTerm(term);
    await fetchStudentData(selectedClass, academicYear, term);
  };
  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
    await fetchStudentData(selectedClass, academicYear, selectedTerm);
  };

  const handleClassChange = async (e) => {
    const selectedClass = e.target.value;
    setSelectedClass(selectedClass);
    await fetchStudentData(selectedClass, academicYear, selectedTerm);
  };

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );

  if (sessionStatus !== "authenticated") redirect("/");

  function formatHeader(header) {
    return header
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  // console.log(students[0]);
  // console.log(students[0].terms);
  return (
    <div className={styles.review}>
      <div className={styles.selectContainer}>
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
        <select value={selectedClass} onChange={handleClassChange}>
          <option value="">Select class</option>
          {session?.teacherOf?.map((classItem) => (
            <option key={classItem} value={classItem}>
              {classItem}
            </option>
          ))}
        </select>
        <select value={selectedTerm} onChange={handleTermChange}>
          <option value="">Select term</option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>
      </div>
      {students.length > 0 && (
        <h1>
          {students[0].level.toUpperCase()} - ({students.length}) students
        </h1>
      )}
      {loading && <h2>Please wait...</h2>}
      <div>
        {students.map((student) => (
          <div key={student.id} className={styles.eachChild}>
            <h2>{`Student: ${student.name} ${student.surname}`}</h2>
            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Level</th>
                    <th>Form Teacher</th>
                    <th>Form Teacher Comments</th>
                    <th>Head of School Comments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{student.gender}</td>
                    <td>{student.age}</td>
                    <td>{student.level}</td>
                    <td>{student.formTeacherName}</td>
                    <td>{student.formTeacherRemark}</td>
                    <td>{student.headOfSchoolRemark}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {student.terms.map((term) => {
              // Get a consistent set of keys across all subjects in this term
              const keys = [
                "subjectName",
                ...Object.keys(term.subjects[0] || {}).filter(
                  (key) =>
                    key !== "id" &&
                    key !== "termId" &&
                    key !== "subjectName" &&
                    term.subjects.some(
                      (subject) =>
                        subject[key] !== null && subject[key] !== undefined,
                    ),
                ),
              ];

              return (
                <div key={term.id} style={{ marginBottom: "20px" }}>
                  <h3>{`Term: ${term.termType}`}</h3>
                  <div className={styles.tableContainer}>
                    <table>
                      <thead>
                        <tr>
                          <th>No</th>
                          {keys.map((key) => (
                            <th key={key}>
                              {key === "subjectName"
                                ? "Subjects"
                                : formatHeader(key)}
                            </th>
                          ))}
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {term.subjects.map((subject, index) => {
                          // Calculate the total score for numeric fields
                          const total = keys
                            .filter(
                              (key) =>
                                typeof subject[key] === "number" ||
                                subject[key] === null,
                            )
                            .reduce((sum, key) => sum + (subject[key] || 0), 0);

                          return (
                            <tr key={subject.id}>
                              <td>{index + 1}</td>
                              {keys.map((key) => (
                                <td key={key}>
                                  {subject[key] !== null &&
                                  subject[key] !== undefined
                                    ? subject[key]
                                    : 0}
                                </td>
                              ))}
                              <td>{total > 0 ? total : "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewResult;
