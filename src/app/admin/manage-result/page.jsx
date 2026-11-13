"use client";
import React, { useEffect, useState } from "react";
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

const Class = () => {
  const [students, setStudents] = useState([]);
  // [{ id, name }] - subjects are identified by id, the name is display only
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  // { [studentId]: { [subjectId]: { [scoreKey]: rawInputString } } }
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
    if (session?.schoolId) fetchSchoolClasses();
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

  const transformData = (data, termType) =>
    data
      .map((student) => {
        const term = student.terms.find((t) => t.termType === termType);
        student.currentTerm = term ? term.subjects : [];
        return student;
      })
      .sort((a, b) =>
        a.surname.toLowerCase().localeCompare(b.surname.toLowerCase()),
      );

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
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
      setSelectedStudentId("");
      setUpdatedScores({});

      // every subject in the class, keyed by id (names are always current)
      const subjectMap = new Map();
      for (const student of transformedData) {
        for (const sub of student.currentTerm || []) {
          if (sub.subjectId != null)
            subjectMap.set(sub.subjectId, sub.subjectName);
        }
      }
      setAvailableSubjects(
        [...subjectMap]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = async (e) => {
    setTermType(e.target.value);
    await fetchStudentData(e.target.value, selectedClass, academicYear);
  };
  const handleClassChange = async (e) => {
    setSelectedClass(e.target.value);
    await fetchStudentData(termType, e.target.value, academicYear);
  };
  const handleAcademicYearChange = async (e) => {
    setAcademicYear(e.target.value);
    await fetchStudentData(termType, selectedClass, e.target.value);
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

  const getExistingSubject = (subjectId) =>
    selectedStudent?.currentTerm?.find((s) => s.subjectId === subjectId);

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

      // merge saved scores into local data so the inputs keep their values
      setStudents((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedStudentId)) return s;
          const currentTerm = [...(s.currentTerm || [])];
          for (const { record } of records) {
            const idx = currentTerm.findIndex(
              (x) => x.subjectId === record.subjectId,
            );
            if (idx >= 0) {
              currentTerm[idx] = { ...currentTerm[idx], ...record.scores };
            } else {
              currentTerm.push({
                subjectId: record.subjectId,
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
