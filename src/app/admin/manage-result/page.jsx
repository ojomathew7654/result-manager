"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./check-result.module.css";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";

const UKP = "THE UKP SCHOOLS";

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

// Returns a new array of new objects (never mutates the API response).
const transformData = (data, termType) =>
  (Array.isArray(data) ? data : [])
    .map((student) => {
      const term = student.terms?.find((t) => t.termType === termType);
      return { ...student, currentTerm: term?.subjects ?? [] };
    })
    .sort((a, b) =>
      (a.surname ?? "")
        .toLowerCase()
        .localeCompare((b.surname ?? "").toLowerCase()),
    );

// Every subject in the class, keyed by schoolSubjectId. Names are display only.
const buildSubjectList = (students) => {
  const map = new Map();
  for (const student of students) {
    for (const sub of student.currentTerm) {
      if (sub.schoolSubjectId != null) {
        map.set(sub.schoolSubjectId, sub.subjectName ?? "Unknown subject");
      }
    }
  }
  return [...map]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const Class = () => {
  const { data: session, status: sessionStatus } = useSession();

  const [students, setStudents] = useState([]);
  // [{ id, name }] where id is the schoolSubjectId
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [input, setInput] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  // { [studentId]: { [schoolSubjectId]: { [scoreKey]: rawInputString } } }
  const [updatedScores, setUpdatedScores] = useState({});

  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [termType, setTermType] = useState("");
  const [loading, setLoading] = useState(false);

  // Ignore responses from older requests when the user changes filters quickly.
  const requestId = useRef(0);

  // Load school info (classes, name, enabled score columns) once.
  useEffect(() => {
    if (!session?.schoolId) return;
    let cancelled = false;

    const fetchSchool = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        if (cancelled || !data) return;
        setSchoolClasses([...(data.classes || [])].sort());
        setSchoolName(data.name || "");
        setInput(data.input || []);
      } catch (error) {
        console.error("Error fetching school:", error);
      }
    };
    fetchSchool();

    return () => {
      cancelled = true;
    };
  }, [session?.schoolId]);

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
  if (sessionStatus !== "authenticated" || session.role !== "ADMIN")
    redirect("/");

  const fetchStudentData = async (term, className, year) => {
    // Clear stale data if any filter is missing.
    if (!term || !className || !year) {
      setStudents([]);
      setAvailableSubjects([]);
      setSelectedStudentId("");
      setUpdatedScores({});
      return;
    }

    const thisRequest = ++requestId.current;
    const encodedYear = encodeURIComponent(year);

    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/student/class/result/${term}-${session.schoolId}-${encodedYear}-${className}`,
      );
      if (thisRequest !== requestId.current) return; // a newer request won

      const transformed = transformData(data, term);
      setStudents(transformed);
      setAvailableSubjects(buildSubjectList(transformed));
      setSelectedStudentId("");
      setUpdatedScores({});
    } catch (error) {
      if (thisRequest !== requestId.current) return;
      console.error("Failed to fetch students:", error.message);
      setStudents([]);
      setAvailableSubjects([]);
    } finally {
      if (thisRequest === requestId.current) setLoading(false);
    }
  };

  const handleTermChange = (e) => {
    setTermType(e.target.value);
    fetchStudentData(e.target.value, selectedClass, academicYear);
  };
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    fetchStudentData(termType, e.target.value, academicYear);
  };
  const handleAcademicYearChange = (e) => {
    setAcademicYear(e.target.value);
    fetchStudentData(termType, selectedClass, e.target.value);
  };

  const selectedStudent = students.find(
    (s) => String(s.id) === String(selectedStudentId),
  );

  const isColumnVisible = (col) => {
    if (!input.includes(col.key)) return false;
    if (col.hideForSS && schoolName === UKP) {
      return !selectedStudent?.level?.toLowerCase().startsWith("ss");
    }
    return true;
  };
  const visibleColumns = COLUMNS.filter(isColumnVisible);

  const getExistingSubject = (subjectId) =>
    selectedStudent?.currentTerm?.find((s) => s.schoolSubjectId === subjectId);

  const getValue = (subjectId, key) =>
    updatedScores[selectedStudentId]?.[subjectId]?.[key] ??
    getExistingSubject(subjectId)?.[key] ??
    "";

  const handleScoreChange = (subjectId, key, value) => {
    setUpdatedScores((prev) => ({
      ...prev,
      [selectedStudentId]: {
        ...prev[selectedStudentId],
        [subjectId]: {
          ...prev[selectedStudentId]?.[subjectId],
          [key]: value,
        },
      },
    }));
  };

  // Only the columns the school actually uses count toward the total.
  const calculateTotal = (subjectId) =>
    input.reduce(
      (acc, key) => acc + (parseFloat(getValue(subjectId, key)) || 0),
      0,
    );

  const handleUpdateScores = async () => {
    const edits = updatedScores[selectedStudentId] || {};

    const records = [];
    for (const [subjectId, fields] of Object.entries(edits)) {
      const scores = {};
      for (const [key, raw] of Object.entries(fields)) {
        if (raw === "" || raw === null || raw === undefined) continue;
        const num = parseFloat(raw);
        if (!Number.isNaN(num)) scores[key] = num;
      }
      if (Object.keys(scores).length > 0) {
        records.push({
          studentId: selectedStudentId,
          record: { subjectId: Number(subjectId), scores },
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

      // Merge saved scores into local data so the inputs keep their values.
      setStudents((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedStudentId)) return s;
          const currentTerm = [...s.currentTerm];
          for (const { record } of records) {
            const idx = currentTerm.findIndex(
              (x) => x.schoolSubjectId === record.subjectId,
            );
            if (idx >= 0) {
              currentTerm[idx] = { ...currentTerm[idx], ...record.scores };
            } else {
              currentTerm.push({
                schoolSubjectId: record.subjectId,
                subjectName: availableSubjects.find(
                  (a) => a.id === record.subjectId,
                )?.name,
                ...record.scores,
              });
            }
          }
          return { ...s, currentTerm };
        }),
      );
      setUpdatedScores((prev) => {
        const { [selectedStudentId]: _saved, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Network Error. Please try again later.",
      );
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
            <h2>
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
                {availableSubjects.map((subject, index) => (
                  <tr key={subject.id}>
                    <td>{index + 1}</td>
                    <td>{subject.name}</td>
                    {visibleColumns.map((col) => (
                      <td key={col.key}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={getValue(subject.id, col.key)}
                          onChange={(e) =>
                            handleScoreChange(
                              subject.id,
                              col.key,
                              e.target.value,
                            )
                          }
                        />
                      </td>
                    ))}
                    <td className={styles.total}>
                      {calculateTotal(subject.id)}
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
