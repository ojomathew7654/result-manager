"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

import UkpSecondary from "@/components/report/upksecondary/page";
import UkpJss from "@/components/report/upkjsclass/page";
import SolidRock from "@/components/report/solidrock/page";
import JayRose from "@/components/report/jayrose/page";
import NewCambridge from "@/components/report/newcambridge/page";
import CrystalBrainsSchool from "@/components/report/CrystalBrainsSchool/page";
import SeedOfGlory from "@/components/report/seedofglory/page";
import BeidaBasic from "@/components/report/BeidaBasic/page";

const StudentResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [academicYear, setAcademicYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(res.data);
      } catch (error) {
        console.error("Error fetching school:", error);
      }
    };
    if (session?.schoolId) {
      fetchSchool();
    }
  }, [session]);

  const fetchStudentData = async (
    selectedTerm,
    academicYear,
    selectedClass
  ) => {
    if (!selectedTerm || !academicYear || !selectedClass) return;
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const { data } = await axios.get(
        `/api/result/${encodedAcademicYear}-${session.schoolId}-${selectedTerm}-${selectedClass}`
      );
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (event) => {
    const value = event.target.value;
    setAcademicYear(value);
    await fetchStudentData(selectedTerm, value, selectedClass);
  };

  const handleTermChange = async (e) => {
    const value = e.target.value;
    setSelectedTerm(value);
    await fetchStudentData(value, academicYear, selectedClass);
  };

  const handleClassChange = async (e) => {
    const value = e.target.value;
    setSelectedClass(value);
    await fetchStudentData(selectedTerm, academicYear, value);
  };

  const generateStudentProps = (entry) => ({
    student: entry.student,
    attendanceList: entry.student.attendanceList?.find(
      (a) => a.termType === selectedTerm
    ),
    school,
    subjects: entry.subjects,
    subjectScores: entry.subjectScores,
    subjectPosition: entry.subjectPosition,
    totalStudents: entry.totalStudents,
    psychomotor:
      entry.student.traitRatings?.filter((tr) => tr.type === "Psychomotor") ||
      [],
    effectiveTraits:
      entry.student.traitRatings?.filter((tr) => tr.type === "Effective") || [],
    formTeacherRemark: entry.student.formTeacherRemark || "",
    headOfSchoolRemark: entry.student.headOfSchoolRemark || "",
    formTeacherName: entry.student.formTeacherName || "",
    selectedTerm,
  });

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500">
        <Spinner /> Please wait...
      </div>
    );
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Print Results"
          subtitle="Generate and print termly student report cards."
          action={
            <div className="flex items-center gap-2">
              {students.length > 0 && (
                <Button
                  onClick={() => window.print()}
                  icon={Printer}
                  variant="primary"
                >
                  Print Report Cards
                </Button>
              )}
              <Button as={Link} href="/admin" variant="outline" icon={ArrowLeft}>
                Dashboard
              </Button>
            </div>
          }
        />

        <Card className="mb-6">
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Term" htmlFor="termSelect">
              <Select
                id="termSelect"
                value={selectedTerm}
                onChange={handleTermChange}
              >
                <option value="" disabled>
                  Select Term
                </option>
                <option value="FIRST">First Term</option>
                <option value="SECOND">Second Term</option>
                <option value="THIRD">Third Term</option>
              </Select>
            </Field>

            <Field label="Academic Year" htmlFor="academicYearSelect">
              <Select
                id="academicYearSelect"
                value={academicYear}
                onChange={handleAcademicYearChange}
              >
                <option value="" disabled>
                  Select academic year
                </option>
                <option value="2025/2026">2025/2026</option>
              </Select>
            </Field>

            <Field label="Class" htmlFor="classSelect">
              <Select
                id="classSelect"
                value={selectedClass}
                onChange={handleClassChange}
              >
                <option value="" disabled>
                  Select class
                </option>
                {school?.classes &&
                  [...school.classes]
                    .sort((a, b) => a.localeCompare(b))
                    .map((classItem) => (
                      <option key={classItem} value={classItem}>
                        {classItem.toUpperCase()}
                      </option>
                    ))}
              </Select>
            </Field>
          </CardBody>
        </Card>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500 no-print">
          <Spinner /> Getting results, please wait...
        </div>
      ) : (
        <>
          {school && students.length > 0 && (
            <div className="print-area space-y-8">
              {school.name === "THE UKP SCHOOLS" &&
                students.map((entry, index) => (
                  <UkpSecondary
                    key={entry.student.id || index}
                    {...generateStudentProps(entry)}
                  />
                ))}

              {school.name === "SOLID ROCK ACADEMY" &&
                students.map((entry, index) => (
                  <SolidRock
                    key={entry.student.id || index}
                    {...generateStudentProps(entry)}
                  />
                ))}

              {school.name === "SEED OF GLORY" &&
                students.map((entry, index) => (
                  <SeedOfGlory
                    key={entry.student.id || index}
                    {...generateStudentProps(entry)}
                  />
                ))}

              {school.name === "New Cambridge" &&
                students.map((entry, index) => (
                  <NewCambridge
                    key={entry.student.id || index}
                    {...generateStudentProps(entry)}
                  />
                ))}

              {school.name === "CRYSTAL BRAINS SCHOOL" &&
                students.map((entry, index) => (
                  <CrystalBrainsSchool
                    key={entry.student.id || index}
                    {...generateStudentProps(entry)}
                  />
                ))}

              {school.name === "Jayrose fruitful aca.." &&
                students.map((entry, index) => (
                  <JayRose
                    key={entry.student.id || index}
                    {...generateStudentProps(entry)}
                  />
                ))}

              {school.name === "Beida Basic School" &&
                students.map((entry, index) => (
                  <BeidaBasic
                    key={entry.student.id || index}
                    {...generateStudentProps(entry)}
                  />
                ))}
            </div>
          )}

          {!loading && selectedClass && students.length === 0 && (
            <Card className="p-8 text-center text-ink-500 no-print">
              <FileText className="mx-auto mb-3 h-10 w-10 text-ink-300" />
              <p className="font-medium text-ink-700">No results found</p>
              <p className="mt-1 text-xs text-ink-400">
                No report card data found for the selected term, academic year, and class.
              </p>
            </Card>
          )}

          {!selectedClass && (
            <Card className="p-8 text-center text-ink-500 no-print">
              <FileText className="mx-auto mb-3 h-10 w-10 text-ink-300" />
              <p className="font-medium text-ink-700">Select Term, Academic Year, and Class</p>
              <p className="mt-1 text-xs text-ink-400">
                Select options above to view and print student report cards.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StudentResult;

