"use client";
import React, { useEffect, useState } from "react";
import styles from "./check-result.module.css";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";

const UKP = "THE UKP SCHOOLS";

// One place that describes every score column.
// hideForSS: for THE UKP SCHOOLS, hide this column for "ss" levels.
const COLUMNS = [
  { key: "rt", label: "R. T", hideForSS: true },
  { key: "firstCA", label: "CA 1" },
  { key: "secondCA", label: "CA 2" },
  { key: "thirdCA", label: "CA 3" },
  { key: "fourthCA", label: "CA 4" },
  { key: "fifthCA", label: "CA 5" },
  { key: "sixthCA", label: "CA 6" },
  { key: "assignment", label: "Ass" },
  { key: "project", label: "Proj" },
  { key: "affective", label: "Affective", hideForSS: true },
  { key: "note", label: "Note", hideForSS: true },
  { key: "exam", label: "Exam" },
];

const Class = () => {
  const [students, setStudents] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  // Shape: { [studentId]: { [subjectName]: { [scoreKey]: rawInputString } } }
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
        setSchoolClasses(data.classes?.sort() || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session.role !== "ADMIN") {
      signOut({ callbackUrl: "/" });
    }
  }, [sessionStatus, session]);

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  const transformData = (data, termType) => {
    const transformed = data.map((student) => {
      const term = student.terms.find((t) => t.termType === termType);
      student.currentTerm = term ? term.subjects : [];
      return student;
    });
    return transformed.sort((a, b) =>
      a.surname.toLowerCase().localeCompare(b.surname.toLowerCase()),
    );
  };

  const fetchStudentData = async (
    termType,
    selectedClass,
    academicYear,
    { keepStudent = false } = {},
  ) => {
    if (!termType || !selectedClass || !academicYear) return;
    const encodedAcademicYear = encodeURIComponent(academicYear);
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

      if (!keepStudent) {
        setSelectedStudentId("");
        setUpdatedScores({});
      }

      // Every subject taken by anyone in the class, so a student who has no
      // record for a subject yet can still have it entered.
      const subjects = Array.from(
        new Set(
          transformedData.flatMap(
            (student) =>
              student.currentTerm?.map((subject) => subject.subjectName) || [],
          ),
        ),
      ).sort();
      setAvailableSubjects(subjects);
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = async (e) => {
    const value = e.target.value;
    setTermType(value);
    await fetchStudentData(value, selectedClass, academicYear);
  };

  const handleClassChange = async (e) => {
    const value = e.target.value;
    setSelectedClass(value);
    await fetchStudentData(termType, value, academicYear);
  };

  const handleAcademicYearChange = async (e) => {
    const value = e.target.value;
    setAcademicYear(value);
    await fetchStudentData(termType, selectedClass, value);
  };

  const selectedStudent = students.find(
    (s) => String(s.id) === String(selectedStudentId),
  );

  const isColumnVisible = (col) => {
    if (!input.includes(col.key)) return false;
    if (col.hideForSS && schoolName === UKP) {
      return !selectedStudent?.level?.startsWith("ss");
    }
    return true;
  };
  const visibleColumns = COLUMNS.filter(isColumnVisible);

  const getExistingSubject = (subjectName) =>
    selectedStudent?.currentTerm?.find((s) => s.subjectName === subjectName);

  const getValue = (subjectName, key) =>
    updatedScores[selectedStudentId]?.[subjectName]?.[key] ??
    getExistingSubject(subjectName)?.[key] ??
    "";

  const handleScoreChange = (subjectName, key, value) => {
    setUpdatedScores((prev) => ({
      ...prev,
      [selectedStudentId]: {
        ...prev[selectedStudentId],
        [subjectName]: {
          ...prev[selectedStudentId]?.[subjectName],
          [key]: value, // keep the raw string so the field can be cleared
        },
      },
    }));
  };

  const calculateTotal = (subjectName) =>
    input.reduce(
      (acc, key) => acc + (parseFloat(getValue(subjectName, key)) || 0),
      0,
    );

  const handleUpdateScores = async () => {
    const edits = updatedScores[selectedStudentId] || {};

    // One record per edited subject, containing only fields that were edited
    // and are not empty.
    const records = [];
    for (const [subjectName, fields] of Object.entries(edits)) {
      const scores = {};
      for (const [key, raw] of Object.entries(fields)) {
        if (raw === "" || raw === null || raw === undefined) continue;
        const num = parseFloat(raw);
        if (!Number.isNaN(num)) scores[key] = num;
      }
      if (Object.keys(scores).length > 0) {
        records.push({
          studentId: selectedStudentId,
          record: { subjectName, scores },
        });
      }
    }

    if (records.length === 0) {
      alert("No changes to save.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.patch(
        `/api/student/class/${selectedClass}`,
        {
          termType,
          records,
        },
      );
      alert(data.message);

      // Merge the saved scores into local data so the inputs keep showing them
      // (no refetch, which can return stale/cached data).
      setStudents((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedStudentId)) return s;
          const currentTerm = [...(s.currentTerm || [])];
          for (const { record } of records) {
            const idx = currentTerm.findIndex(
              (x) => x.subjectName === record.subjectName,
            );
            if (idx >= 0) {
              currentTerm[idx] = { ...currentTerm[idx], ...record.scores };
            } else {
              currentTerm.push({
                subjectName: record.subjectName,
                ...record.scores,
              });
            }
          }
          return { ...s, currentTerm };
        }),
      );

      // Saved edits are now part of students, so clear the pending ones.
      setUpdatedScores((prev) => {
        const { [selectedStudentId]: _saved, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      alert("Network Error. Please try again later.");
      console.error("Failed to update scores:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges =
    Object.keys(updatedScores[selectedStudentId] || {}).length > 0;

  return (
    <div className={styles.checkResult}>
      <h1>Please select academic year, term, class, and student.</h1>
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
          id="students"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          <option value="" disabled>
            {loading ? "Please wait..." : "Select Student"}
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.surname} {student.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && selectedStudent && (
        <div className={styles.tableContainer}>
          <div>
            <h2 className={styles.selectedStudents}>
              {selectedStudent.surname} {selectedStudent.name}
            </h2>
            <table border={1}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Subject</th>
                  {visibleColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {availableSubjects.map((subjectName, index) => (
                  <tr key={subjectName}>
                    <td>{index + 1}</td>
                    <td>{subjectName}</td>
                    {visibleColumns.map((col) => (
                      <td key={col.key}>
                        <input
                          type="number"
                          value={getValue(subjectName, col.key)}
                          onChange={(e) =>
                            handleScoreChange(
                              subjectName,
                              col.key,
                              e.target.value,
                            )
                          }
                        />
                      </td>
                    ))}
                    <td className={styles.total}>
                      {calculateTotal(subjectName)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleUpdateScores}
              className={loading ? styles.disabled : undefined}
              disabled={loading || !hasUnsavedChanges}
            >
              {loading ? "Updating..." : "Update Scores"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Class;
