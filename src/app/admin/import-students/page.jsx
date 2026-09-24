"use client";

import React, { useState } from "react";
import FileInput from "@/components/excel/FileInput";
import ReadExcel from "@/components/excel/ReadExcel";
import axios from "axios";
import { Save, Info } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSonner } from "@/lib/useSonner";

const ImportStudents = () => {
  const { customSonner } = useSonner();
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
    if (studentData.length === 0) return;
    setLoading(true);
    try {
      let successCount = 0;
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
          formattedStudent
        );
        if (data.status !== 409) {
          successCount++;
        }
      }
      customSonner({
        type: "success",
        text: `Import complete! Processed ${studentData.length} records (${successCount} added).`,
      });
    } catch (error) {
      console.error("Error saving student data:", error);
      customSonner({
        type: "error",
        text: "An error occurred while saving student records. Please check console.",
      });
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders = [
    "Surname",
    "Name",
    "Academic Year",
    "Age",
    "Class",
    "Gender",
    "Reg No",
    "Username",
    "Password",
    "School ID",
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        dark={false}
        title="Import Students"
        subtitle="Bulk import students into your school database using an Excel spreadsheet."
      />

      {/* Card 1: File Upload & Instructions */}
      <Card>
        <CardHeader
          title="Upload Excel Spreadsheet"
          subtitle="Select an .xlsx or .xls file containing student details"
        />
        <CardBody className="space-y-4">
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-sm text-brand-900">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 shrink-0 text-brand-600" size={18} />
              <div>
                <p className="font-semibold">Excel File Column Order:</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-700">
                  Ensure your Excel file columns follow this order:
                  <br />
                  <span className="font-medium">
                    1. Surname | 2. Name | 3. Academic Year | 4. Age | 5. Class | 6. Gender | 7. Reg No | 8. Username | 9. Password | 10. School ID
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/30 p-6 text-center">
            <FileInput onFileChange={handleFileChange} />
          </div>
        </CardBody>
      </Card>

      {/* Card 2: Preview & Editing Table */}
      {studentData.length > 0 && (
        <Card>
          <CardHeader
            title="Import Preview & Editable Table"
            subtitle={`Loaded ${studentData.length} student records from file`}
            action={
              <Button
                onClick={handleSave}
                disabled={loading}
                variant="primary"
                icon={Save}
              >
                {loading ? "Saving to Database..." : "Save to Database"}
              </Button>
            }
          />
          <CardBody className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-ink-100">
              <table className="w-full text-left text-sm text-ink-700">
                <thead className="bg-ink-50 text-xs uppercase font-semibold text-ink-600 border-b border-ink-100">
                  <tr>
                    {tableHeaders.map((header, idx) => (
                      <th key={idx} className="whitespace-nowrap px-3 py-3">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {studentData.map((student, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-ink-50/50 transition-colors">
                      {student.map((field, fieldIndex) => (
                        <td key={fieldIndex} className="p-1.5 min-w-[120px]">
                          <input
                            type="text"
                            value={field}
                            onChange={(e) =>
                              handleInputChange(e, rowIndex, fieldIndex)
                            }
                            className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                variant="primary"
                icon={Save}
                size="lg"
              >
                {loading ? "Saving to Database..." : `Save ${studentData.length} Students to Database`}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ImportStudents;
