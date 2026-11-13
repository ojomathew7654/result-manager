"use client";
import React, { useEffect, useState } from "react";
import "./Class.css";
import { useSession } from "next-auth/react";
import axios from "axios";

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
  { key: "note", label: "Note", hideForSS: true },
  { key: "affective", label: "Affective", hideForSS: true },
  { key: "project", label: "Proj" },
  { key: "exam", label: "Exam" },
];

const Class = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  // New sessions carry subjectIds. Sessions created before the migration only
  // carry names, so we fall back to names for them (remove once everyone has
  // logged in again).
  const [userSubjectIds, setUserSubjectIds] = useState(undefined);
  const [userSubjectNames, setUserSubjectNames] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]); // [{ id, name }]
  // { [studentId]: { [subjectId]: { [scoreKey]: rawInputString } } }
  const [updatedScores, setUpdatedScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const { data: session } = useSession();
  const [termType, setTermType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [input, setInput] = useState([]);

  useEffect(() => {
    setUserClasses(session?.classes || []);
    setUserSubjectIds(session?.subjectIds);
    setUserSubjectNames(session?.subjects || []);
  }, [session]);

  const isAllowed = (sub) =>
    userSubjectIds
      ? userSubjectIds.includes(sub.subjectId)
      : userSubjectNames.includes(sub.subjectName);

  const hasAnySubject = userSubjectIds
    ? userSubjectIds.length > 0
    : userSubjectNames.length > 0;

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    if (!termType || !selectedClass || !academicYear || !hasAnySubject) return;

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

      const transformedData = data
        .map((student) => ({
          ...student,
          currentTerm: student.terms.find((t) => t.termType === termType),
        }))
        .sort((a, b) =>
          a.surname
            .toLowerCase()
            .trim()
            .localeCompare(b.surname.toLowerCase().trim()),
        );
      setStudents(transformedData);

      // only the subjects this teacher is assigned to, keyed by id
      const subjectMap = new Map();
      for (const student of transformedData) {
        for (const sub of student.currentTerm?.subjects || []) {
          if (sub.subjectId != null && isAllowed(sub)) {
            subjectMap.set(sub.subjectId, sub.subjectName);
          }
        }
      }
      setAvailableSubjects(
        [...subjectMap]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      setSelectedStudentId("");
      setUpdatedScores({});
    } catch (error) {
      console.error("Failed to fetch students:", error.message);
    }
    setLoading(false);
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
    selectedStudent?.currentTerm?.subjects?.find(
      (s) => s.subjectId === subjectId,
    );

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
        { termType, records },
      );
      alert(data.message);

      setStudents((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedStudentId)) return s;
          const term = s.currentTerm || { termType, subjects: [] };
          const subjects = [...(term.subjects || [])];
          for (const { record } of records) {
            const idx = subjects.findIndex(
              (x) => x.subjectId === record.subjectId,
            );
            if (idx >= 0) {
              subjects[idx] = { ...subjects[idx], ...record.scores };
            } else {
              subjects.push({
                subjectId: record.subjectId,
                subjectName: availableSubjects.find(
                  (a) => a.id === record.subjectId,
                )?.name,
                ...record.scores,
              });
            }
          }
          return { ...s, currentTerm: { ...term, subjects } };
        }),
      );

      setUpdatedScores((prev) => {
        const { [selectedStudentId]: _saved, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Failed to update scores. Please try again later.",
      );
      console.error("Failed to update scores:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges =
    Object.keys(updatedScores[selectedStudentId] || {}).length > 0;

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
        <div className="tableContainer">
          <div>
            <h2>
              {selectedStudent.surname} {selectedStudent.name}
            </h2>
            <div className="tableContainer">
              <table border={3}>
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
                      <td className="total">{calculateTotal(subject.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="save-button-container">
              <button
                className="updateScoresBtn"
                onClick={handleUpdateScores}
                disabled={loading || !hasUnsavedChanges}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Class;
