"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./ManualAttendance.module.css";

const ManualAttendance = ({ session }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [termType, setTermType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    if (!termType || !selectedClass || !academicYear) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/student/class/${termType}-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`,
      );

      setStudents(data);
      const initialAttendanceData = {};
      data.forEach((student) => {
        const attendance = student.attendanceList.find(
          (item) => item.termType === termType && item.session === academicYear,
        );
        if (attendance) {
          initialAttendanceData[student.id] = {
            schoolOpenDays: attendance.schoolOpenDays,
            daysAbsent: attendance.daysAbsent,
            daysPresent: attendance.daysPresent,
          };
        }
      });
      setAttendanceData(initialAttendanceData);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
    await fetchStudentData(termType, selectedClass, academicYear);
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

  const handleInputChange = (studentId, field, value) => {
    setAttendanceData((prevData) => ({
      ...prevData,
      [studentId]: {
        ...prevData[studentId],
        [field]: value,
      },
    }));
  };

  const submitAttendance = async () => {
    setLoading(true);
    try {
      await Promise.all(
        students.map((student) =>
          axios.post(`/api/student/attendance`, {
            studentId: student.id,
            termType,
            session: academicYear,
            schoolOpenDays: attendanceData[student.id]?.schoolOpenDays || 0,
            daysAbsent: attendanceData[student.id]?.daysAbsent || 0,
            daysPresent: attendanceData[student.id]?.daysPresent || 0,
          }),
        ),
      );
      alert("Attendance submitted successfully.");
    } catch (error) {
      console.error("Failed to submit attendance", error);
      alert("There was an error submitting the attendance.");
    }
    setLoading(false);
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
    <div className={styles.container}>
      <h2>Attendance Register</h2>
      <h3>Please select academicYear, term, class, then subject</h3>
      <div className={styles.selectContainer}>
        <select value={academicYear} onChange={handleAcademicYearChange}>
          <option value="" disabled>
            Select academic year
          </option>
          <option value="2026/2027">2026/2027</option>
        </select>
        <select value={selectedClass} onChange={handleClassChange}>
          <option value="">Select class</option>
          {session.teacherOf?.map((classItem) => (
            <option key={classItem} value={classItem}>
              {classItem}
            </option>
          ))}
        </select>
        <select value={termType} onChange={handleTermChange}>
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>
      </div>
      {termType && academicYear && (
        <div className={styles.tableContainer}>
          <table className={styles.attendanceTable}>
            <thead>
              <tr>
                <th>No</th>
                <th>Surname</th>
                <th>Name</th>
                <th>School Open Days</th>
                <th>Days Present</th>
                <th>Days Absent</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.surname}</td>
                  <td>{student.name}</td>
                  <td>
                    <input
                      type="number"
                      value={attendanceData[student.id]?.schoolOpenDays || ""}
                      onChange={(e) =>
                        handleInputChange(
                          student.id,
                          "schoolOpenDays",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={attendanceData[student.id]?.daysPresent || ""}
                      onChange={(e) =>
                        handleInputChange(
                          student.id,
                          "daysPresent",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={attendanceData[student.id]?.daysAbsent || ""}
                      onChange={(e) =>
                        handleInputChange(
                          student.id,
                          "daysAbsent",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {termType && academicYear && (
        <div className={styles.buttonContainer}>
          <button
            className={loading ? styles.disabled : ""}
            onClick={submitAttendance}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Update Attendance"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualAttendance;
