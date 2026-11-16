"use client";
import React, { useState } from "react";
import FileInput from "@/components/excel/FileInput";
import ReadExcel from "@/components/excel/ReadExcel";
import styles from "./ImportStudents.module.css";
import axios from "axios";

const ImportStudents = () => {
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (file) => {
    try {
      const datas = await ReadExcel(file);
      const filteredData = datas
        .filter((item) => Array.isArray(item) && item[0])
        .map((item) => {
          // Ensure every row has exactly 10 elements, filling missing ones with empty strings
          return Array.from({ length: 10 }, (_, i) => item[i] || "");
        });
      setStudentData(filteredData);
    } catch (error) {
      console.error("Error reading the Excel file:", error);
    }
  };

  const handleInputChange = (e, rowIndex, fieldIndex) => {
    const { value } = e.target;
    const updatedData = [...studentData];
    updatedData[rowIndex][fieldIndex] = value;
    setStudentData(updatedData);
  };

  const handleSave = async () => {
    setLoading(true);
    alert("gghhjgfhjy");
    try {
      for (const student of studentData) {
        const formattedStudent = {
          surname: student[0].toString().trim(),
          name: student[1].toString().trim(),
          academicYear: student[2].toString().trim(),
          age: student[3].toString().trim(),
          level: student[4].toString().trim(),
          gender: student[5].toString().trim(),
          registrationNo: student[6].toString().trim(),
          username: student[7].toString().trim(),
          password: student[8].toString().trim(),
          schoolId: Number(student[9]),
        };

        const { data } = await axios.post(
          "/api/student/create",
          formattedStudent,
        );
        console.log(data);
        alert(data.message);
      }
    } catch (error) {
      console.error("Error saving student data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>
        If you already have all students in excel format you can add them once.
      </h2>
      <FileInput onFileChange={handleFileChange} />
      <div className={styles.tableContainer}>
        {studentData.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Surname</th>
                <th>Name</th>
                <th>Academic Year</th>
                <th>Age</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Registration No</th>
                <th>Username</th>
                <th>Password</th>
                <th>School ID</th>
              </tr>
            </thead>
            <tbody>
              {studentData.map((student, rowIndex) => (
                <tr key={rowIndex}>
                  {student.map((field, fieldIndex) => (
                    <td key={fieldIndex}>
                      <input
                        type="text"
                        value={field}
                        onChange={(e) =>
                          handleInputChange(e, rowIndex, fieldIndex)
                        }
                        className={styles.input}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {studentData.length > 0 && (
        <div className={styles.submitbtnContainer}>
          <button
            onClick={handleSave}
            disabled={loading}
            className={loading ? styles.disabled : ""}
          >
            {loading ? "Adding please wait..." : "Save to Database"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportStudents;
