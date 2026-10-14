"use client";
import React, { useState, useEffect } from "react";
import styles from "./Attendance.module.css";
import { parse, addDays, format, differenceInDays } from "date-fns";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ManualAttendance from "./ManualAttendance";
import Spinner from "@/components/Spinner/Spinner";

const resumptionDateStr = "Monday 09/09/2024";
const days = ["M", "T", "W", "TH", "F"];
const weeks = Array.from({ length: 13 }, (_, i) => `WEEK ${i + 1}`);

const AttendanceRegister = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [termType, setTermType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);
  const resumptionDate = parse(
    resumptionDateStr,
    "EEEE dd/MM/yyyy",
    new Date(),
  );
  const currentDate = new Date();
  const totalDays = differenceInDays(currentDate, resumptionDate);
  const currentWeekIndex = Math.floor(totalDays / 7);
  const currentDayIndex = totalDays % 7;
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (students.length > 0) {
      setAttendance((prevAttendance) => {
        const newAttendance = { ...prevAttendance };
        for (const student of students) {
          if (!newAttendance[student.id]) {
            newAttendance[student.id] = weeks.reduce((weekAcc, week) => {
              weekAcc[week] = {
                M: false,
                T: false,
                W: false,
                TH: false,
                F: false,
              };
              return weekAcc;
            }, {});
          }
          if (student.attendance.length > 0) {
            const presentDates = student.attendance[0].presentDates;
            for (const dateStr of presentDates) {
              const date = new Date(dateStr);
              const weekIndex = Math.floor(
                differenceInDays(date, resumptionDate) / 7,
              );
              const dayIndex = differenceInDays(date, resumptionDate) % 7;
              const week = `WEEK ${weekIndex + 1}`;
              const day = days[dayIndex];
              if (newAttendance[student.id][week]) {
                newAttendance[student.id][week][day] = true;
              }
            }
          }
        }
        return newAttendance;
      });
    }
  }, [students]);

  if (sessionStatus == "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  const getAttendanceDate = (weekIndex, dayIndex) => {
    return format(
      addDays(resumptionDate, weekIndex * 7 + dayIndex),
      "yyyy/MM/dd",
    );
  };

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    if (!termType || !selectedClass || !academicYear) return;
    const encodedAcademicYear = encodeURIComponent(academicYear);
    const { data } = await axios.get(
      `/api/student/class/${termType}-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`,
    );
    setStudents(data);
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

  const handleCheck = (student, week, day) => {
    const isPresentChecked = attendance[student.id]?.[week]?.[day];

    // Check if anyone is marked present for the current day and week
    const isAnyPresent = students.some(
      (s) => attendance[s.id]?.[week]?.[day] === true,
    );

    // If trying to mark absent (uncheck) and no one is present, prevent it
    if (isPresentChecked && !isAnyPresent) {
      return;
    }

    // Proceed with toggling attendance
    const newAttendance = { ...attendance };

    // Initialize attendance for the student and week if not already set
    if (!newAttendance[student.id]) {
      newAttendance[student.id] = {};
    }
    if (!newAttendance[student.id][week]) {
      newAttendance[student.id][week] = {
        M: false,
        T: false,
        W: false,
        TH: false,
        F: false,
      };
    }

    // Toggle attendance for the specific day
    newAttendance[student.id][week][day] =
      !newAttendance[student.id][week][day];

    setAttendance(newAttendance);
  };

  const updateAttendance = async () => {
    if (!academicYear || !termType) {
      alert("Please select academic year and term");
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        students.map(async (student) => {
          let totalPresent = 0;
          let totalAbsent = 0;
          const presentDates = [];
          const absentDates = [];
          for (const week in attendance[student.id]) {
            for (const day in attendance[student.id][week]) {
              const isPresent = attendance[student.id][week][day];
              const weekIndex = parseInt(week.split(" ")[1]) - 1;
              const dayIndex = days.indexOf(day);
              const date = getAttendanceDate(weekIndex, dayIndex);

              if (isPresent) {
                totalPresent++;
                presentDates.push(date);
              } else {
                totalAbsent++;
                absentDates.push(date);
              }
            }
          }
          const { data } = await axios.patch(`/api/student/attendance`, {
            username: student.username,
            totalPresent,
            totalAbsent,
            presentDates,
            absentDates,
            academicYear,
            termType,
          });
        }),
      );
      alert(data.message);
    } catch (err) {
      console.error("Failed to update attendance", err);
      alert(data.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (studentId) => {
    const studentAttendance = attendance[studentId] || {};
    return Object.values(studentAttendance).reduce((total, week) => {
      return (
        total +
        Object.values(week).reduce((weekTotal, day) => {
          return weekTotal + (day ? 1 : 0);
        }, 0)
      );
    }, 0);
  };

  return (
    <div className={styles.container}>
      <ManualAttendance session={session} />

      {/* {session.schoolId == 2 && (
        <div>
          {" "}
          <h2>Automated Attendance Register</h2>
          <div className={styles.selectContainer}>
            <select
              id="termSelect"
              value={termType}
              onChange={handleTermChange}
            >
              <option value="" disabled>
                Select Term
              </option>
              <option value="FIRST">First Term</option>
              <option value="SECOND">Second Term</option>
              <option value="THIRD">Third Term</option>
            </select>
            <select value={selectedClass} onChange={handleClassChange}>
              <option value="">Select class</option>
              {session.teacherOf?.map((classItem) => (
                <option key={classItem} value={classItem}>
                  {classItem}
                </option>
              ))}
            </select>
            <select
              id="academicYearSelect"
              value={academicYear}
              onChange={handleAcademicYearChange}
            >
              <option value="" disabled>
                Select academic year
              </option>
              <option value="2023/2024">2023/2024</option>
               <option value="2026/2027">2026/2027</option>
            </select>
          </div>
          {termType && academicYear && (
            <div>
              {weeks.reduce((acc, week, index) => {
                if (index % 2 === 0) {
                  acc.push(
                    <div className={styles.tableContainer}>
                      <table className={styles.attendanceTable} key={week}>
                        <thead>
                          <tr>
                            <th rowSpan={2}>No</th>
                            <th rowSpan={2}>Surname</th>
                            <th rowSpan={2}>Name</th>
                            {weeks
                              .slice(index, index + 2)
                              .map((week, weekIndex) => (
                                <th
                                  key={week}
                                  className={`${
                                    index + weekIndex === currentWeekIndex
                                      ? styles.currentWeek
                                      : styles.allweeks
                                  }`}
                                  colSpan={days.length}
                                >
                                  <strong>{week}</strong>
                                </th>
                              ))}
                            {index + 2 >= weeks.length && (
                              <th rowSpan={2}>Total</th>
                            )}
                          </tr>
                          <tr>
                            {weeks
                              .slice(index, index + 2)
                              .map((week, weekIndex) =>
                                days.map((day, dayIndex) => (
                                  <th
                                    key={week + day}
                                    className={
                                      dayIndex === currentDayIndex &&
                                      index + weekIndex === currentWeekIndex
                                        ? styles.currentDay
                                        : ""
                                    }
                                  >
                                    {day.charAt(0)}
                                  </th>
                                ))
                              )}
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, studentIndex) => (
                            <tr key={student.id}>
                              <td>{studentIndex + 1}</td>
                              <td>{student.surname}</td>
                              <td>{student.name}</td>
                              {weeks.slice(index, index + 2).map((week) => (
                                <React.Fragment key={week}>
                                  {days.map((day) => (
                                    <td key={week + day}>
                                      <input
                                        type="checkbox"
                                        checked={
                                          attendance[student.id]?.[week]?.[
                                            day
                                          ] || false
                                        }
                                        onChange={() =>
                                          handleCheck(student, week, day)
                                        }
                                      />
                                    </td>
                                  ))}
                                </React.Fragment>
                              ))}
                              {index + 2 >= weeks.length && (
                                <td>{calculateTotal(student.id)}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return acc;
              }, [])}
            </div>
          )}
          {termType && academicYear && (
            <div className={styles.buttonContainer}>
              <button
                className={loading ? styles.disabled : ""}
                disabled={loading}
                onClick={updateAttendance}
              >
                {loading ? "Updating..." : "Update Attendance"}
              </button>
            </div>
          )}
        </div>
      )} */}
    </div>
  );
};

export default AttendanceRegister;
