"use client";
import React, { useState, useEffect } from "react";
import styles from "./Attendance.module.css";
import { parse, addDays, format, differenceInDays } from "date-fns";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Spinner from "@/components/Spinner/Spinner";

const resumptionDateStr = "Monday 22/04/2024";
const days = ["M", "T", "W", "TH", "F"];
const weeks = Array.from({ length: 13 }, (_, i) => `WEEK ${i + 1}`);

const AttendanceRegister = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState("");
  const [termType, setTermType] = useState("");
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
  const [schoolClasses, setSchoolClasses] = useState([]);
  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchoolClasses(data.classes);
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

  const getAttendanceDate = (weekIndex, dayIndex) => {
    return format(
      addDays(resumptionDate, weekIndex * 7 + dayIndex),
      "yyyy/MM/dd",
    );
  };

  const fetchStudentData = async (termType, selectedClass, academicYear) => {
    console.log(termType, selectedClass, academicYear);
    if (!termType || !selectedClass || !academicYear) return;
    const encodedAcademicYear = encodeURIComponent(academicYear);
    const { data } = await axios.get(
      `/api/student/class/${termType}-${session.schoolId}-${encodedAcademicYear}-${selectedClass}`,
    );
    console.log(data);
    setStudents(data);
  };

  const handleAcademicYearChange = async (event) => {
    const academicYear = event.target.value;
    setAcademicYear(academicYear);
    await fetchStudentData(termType, selectedClass, academicYear);
  };

  const handleClassChange = async (event) => {
    const selectedClass = event.target.value;
    setSelectedClass(selectedClass);
    await fetchStudentData(termType, selectedClass, academicYear);
  };

  const handleTermChange = async (event) => {
    const termType = event.target.value;
    setTermType(termType);
    await fetchStudentData(termType, selectedClass, academicYear);
  };

  const handleCheck = (student, week, day) => {
    const newAttendance = { ...attendance };
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
          await axios.patch(`/api/student/attendance`, {
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
      alert("Attendance updated successfully.");
    } catch (err) {
      console.error("Failed to update attendance", err);
      alert("Network Error. Please try again later.");
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
  if (sessionStatus == "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div className={styles.container}>
      <h1>Attendance Register</h1>
      <div className={styles.selectContainer}>
        <select
          id="classSelect"
          value={selectedClass}
          onChange={handleClassChange}
        >
          <option value={""} disabled>
            Select Class
          </option>
          {schoolClasses.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        <select id="termSelect" value={termType} onChange={handleTermChange}>
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>
        <select
          id="academicYearSelect"
          value={academicYear}
          onChange={handleAcademicYearChange}
        >
          <option value="" disabled>
            Select academy year
          </option>
          <option value="2026/2027">2026/2027</option>
        </select>
      </div>
      {selectedClass !== "" && (
        <div className={styles.tableContainer}>
          {weeks.reduce((acc, week, index) => {
            if (index % 2 === 0) {
              acc.push(
                <table className={styles.attendanceTable} key={week}>
                  <thead>
                    <tr>
                      <th rowSpan={2}>No</th>
                      <th rowSpan={2}>Surname</th>
                      <th rowSpan={2}>Name</th>
                      {weeks.slice(index, index + 2).map((week, weekIndex) => (
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
                      {index + 2 >= weeks.length && <th rowSpan={2}>Total</th>}
                    </tr>
                    <tr>
                      {weeks.slice(index, index + 2).map((week, weekIndex) =>
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
                        )),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, studentIndex) => (
                      <tr key={student.id}>
                        <td>{studentIndex + 1}</td>
                        <td>{student.surname}</td>
                        <td>{student.name}</td>
                        {weeks.slice(index, index + 2).map((week) =>
                          days.map((day) => (
                            <td key={student.id + week + day}>
                              <input
                                type="checkbox"
                                checked={
                                  attendance[student.id]?.[week]?.[day] || false
                                }
                                onChange={() => handleCheck(student, week, day)}
                              />
                            </td>
                          )),
                        )}
                        {index + 2 >= weeks.length && (
                          <td>{calculateTotal(student.id)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>,
              );
            }
            return acc;
          }, [])}
        </div>
      )}
      <div className={styles.buttonContainer}>
        <button
          className={loading ? styles.disabled : ""}
          disabled={loading}
          onClick={updateAttendance}
        >
          {loading ? "Updating..." : "Update Attendance"}
        </button>
      </div>
    </div>
  );
};

export default AttendanceRegister;
