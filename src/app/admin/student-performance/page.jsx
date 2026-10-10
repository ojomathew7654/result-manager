"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";
import { ArrowLeft, Printer, TrendingUp, Search, FileText } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

const StudentPerformance = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [broadsheetLoading, setBroadsheetLoading] = useState(false);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [termType, setTermType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState({});
  const [levelAndVariant, setLevelAndVariant] = useState(null);
  const [activeTab, setActiveTab] = useState("broadsheet");
  const contentToPrint = useRef(null);

  const handlePrint = useReactToPrint({
    documentTitle: "Broadsheet",
    content: () => contentToPrint.current,
    removeAfterPrint: true,
  });

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data || {});
        setSchoolClasses(data.classes ? [...data.classes].sort() : []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.role !== "ADMIN") {
      signOut({ redirect: false }).then(() => redirect("/"));
    }
  }, [sessionStatus, session]);

  const getTermlyPerformance = async (force = false) => {
    if (!academicYear || !selectedClass || !termType) {
      alert("Please select academicYear, term and Class");
      return;
    }

    setActiveTab("broadsheet");

    if (!force && students.length > 0) {
      return;
    }

    setBroadsheetLoading(true);
    try {
      const { data } = await axios.get("/api/student/performance", {
        params: {
          selectedClass,
          schoolId: session.schoolId,
          termType,
          academicYear,
        },
      });

      const levelAndVar = data.map(({ level, variant }) => ({
        level,
        variant,
      }));
      setLevelAndVariant(levelAndVar[0]);

      const sanitizedStudents = data.map(({ level, variant, ...rest }) => rest);
      const sortedStudents = sanitizedStudents.sort(
        (a, b) => a.position - b.position
      );
      setStudents(sortedStudents);
    } catch (error) {
      console.error(error);
    } finally {
      setBroadsheetLoading(false);
    }
  };

  const getYeralyPerformance = async (force = false) => {
    if (!academicYear || !selectedClass) {
      alert("Please select academicYear and Class");
      return;
    }

    setActiveTab("position");

    if (!force && yearlyData.length > 0) {
      return;
    }

    setYearlyLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const [level, variant] = selectedClass.split("-");
      const { data } = await axios.get(
        `/api/student/performance/yearly/${encodedAcademicYear}-${session?.schoolId}-${level}-${variant}`
      );
      setYearlyData(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setYearlyLoading(false);
    }
  };

  const handleAcademicYearChange = (event) => {
    setAcademicYear(event.target.value);
    setStudents([]);
    setYearlyData([]);
  };

  const handleTermChange = (event) => {
    setTermType(event.target.value);
    setStudents([]);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setStudents([]);
    setYearlyData([]);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500">
        <Spinner /> Please wait...
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  const subjectKeys = Array.from(
    new Set(
      students.flatMap((student) =>
        Object.keys(student).filter(
          (key) =>
            !["surname", "name", "totalScore", "average", "position"].includes(
              key
            )
        )
      )
    )
  );

  const PaddedCell = ({ value }) => <>{value ?? "-"}</>;

  return (
    <div>
      <PageHeader
        dark={false}
        title="Student Performance"
        subtitle="Generate termly broadsheets and track academic year student performance rankings."
        action={
          <Button as={Link} href="/admin" variant="outline" icon={ArrowLeft}>
            Dashboard
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Term" htmlFor="termSelect">
            <Select value={termType} onChange={handleTermChange} id="termSelect">
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

          <Field label="Class" htmlFor="class-select">
            <Select
              id="class-select"
              value={selectedClass}
              onChange={handleClassChange}
            >
              <option value="" disabled>
                Select Class
              </option>
              {schoolClasses.map((className) => (
                <option key={className} value={className}>
                  {className.toUpperCase()}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          disabled={broadsheetLoading}
          onClick={getTermlyPerformance}
          icon={Search}
          variant={activeTab === "broadsheet" ? "primary" : "outline"}
        >
          {broadsheetLoading ? "Generating..." : "Get Broadsheet"}
        </Button>
        <Button
          disabled={yearlyLoading}
          onClick={getYeralyPerformance}
          icon={TrendingUp}
          variant={activeTab === "position" ? "primary" : "outline"}
        >
          {yearlyLoading ? "Generating..." : "Get Academic Position"}
        </Button>
      </div>

      {activeTab === "broadsheet" && (
        students?.length > 0 ? (
          <Card className="mb-8">
            <CardHeader
              title={`${levelAndVariant?.level || ""} ${levelAndVariant?.variant || ""} Termly Broadsheet`}
              action={
                <Button onClick={handlePrint} icon={Printer} variant="outline" size="sm">
                  Print Broadsheet
                </Button>
              }
            />
            <CardBody className="overflow-x-auto p-0">
              <div ref={contentToPrint} className="p-4 bg-white">
                <header className="mb-4 border-b border-ink-100 pb-4 text-center">
                  {school?.logo && (
                    <div className="mb-2 flex justify-center">
                      <Image
                        src={school.logo}
                        alt="logo"
                        height={90}
                        width={110}
                        className="h-20 w-auto object-contain"
                      />
                    </div>
                  )}
                  <h3 className="font-display text-lg font-bold text-ink-900">
                    {school?.fullName ? school.fullName.toUpperCase() : ""}
                  </h3>
                  {school.name === "CRYSTAL BRAINS SCHOOL" && (
                    <h4 className="text-xs font-semibold text-ink-600">BRITISH AND MONTESSORI</h4>
                  )}
                  {school?.motto && (
                    <p className="text-xs italic text-ink-500">
                      MOTTO: {school.motto.toUpperCase()}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-semibold text-brand-700">
                    {`${levelAndVariant?.level?.toUpperCase() || ""}${
                      levelAndVariant?.variant
                        ? " - " + levelAndVariant.variant.toUpperCase()
                        : ""
                    } Broadsheet – ${termType} Term, ${academicYear || "2025/2026"} Academic Session`}
                  </p>
                </header>

                <table className="min-w-full border-collapse border border-ink-200 text-left text-xs">
                  <thead className="bg-ink-50 text-ink-700">
                    <tr>
                      <th className="border border-ink-200 px-2 py-1.5 text-center">#</th>
                      <th className="border border-ink-200 px-2 py-1.5">Surname</th>
                      <th className="border border-ink-200 px-2 py-1.5">Name</th>
                      {subjectKeys.map((subject) => {
                        const trimmedSubject = subject.trim();
                        const normalized = trimmedSubject.toLowerCase();
                        const isMath =
                          normalized === "mathematics" || normalized === "math";
                        const displaySubject = isMath ? "MATH" : trimmedSubject;
                        const subjectLines = displaySubject.split(/\s+/);

                        return (
                          <th
                            key={subject}
                            className="border border-ink-200 px-1 py-1.5 text-center"
                            title={trimmedSubject}
                          >
                            <div className="leading-tight">
                              {subjectLines.map((word, idx) => (
                                <React.Fragment key={idx}>
                                  {word.toUpperCase()}
                                  {idx !== subjectLines.length - 1 && <br />}
                                </React.Fragment>
                              ))}
                            </div>
                          </th>
                        );
                      })}

                      <th className="border border-ink-200 px-2 py-1.5 text-center">Total</th>
                      <th className="border border-ink-200 px-2 py-1.5 text-center">Avg</th>
                      <th className="border border-ink-200 px-2 py-1.5 text-center">Pos</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-ink-100">
                    {students.map((student, index) => (
                      <tr key={index} className="hover:bg-ink-50/50">
                        <td className="border border-ink-200 px-2 py-1 text-center font-medium text-ink-500">
                          <PaddedCell value={index + 1} />
                        </td>
                        <td className="border border-ink-200 px-2 py-1 font-medium text-ink-900">
                          <PaddedCell value={student.surname} />
                        </td>
                        <td className="border border-ink-200 px-2 py-1 font-medium text-ink-900">
                          {student.name}
                        </td>

                        {subjectKeys.map((subject) => (
                          <td key={subject} className="border border-ink-200 px-1 py-1 text-center">
                            <PaddedCell value={student[subject]} />
                          </td>
                        ))}

                        <td className="border border-ink-200 px-2 py-1 text-center font-bold text-ink-900">
                          <PaddedCell value={student.totalScore} />
                        </td>
                        <td className="border border-ink-200 px-2 py-1 text-center font-semibold text-brand-700">
                          <PaddedCell
                            value={student.average ? `${Number(student.average).toFixed(2)}%` : "-"}
                          />
                        </td>
                        <td className="border border-ink-200 px-2 py-1 text-center font-bold text-emerald-600">
                          <PaddedCell value={student.position} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="p-8 text-center text-ink-500">
            <FileText className="mx-auto mb-3 h-10 w-10 text-ink-300" />
            <p className="font-medium text-ink-700">Broadsheet View</p>
            <p className="mt-1 text-xs text-ink-400">
              Select Academic Year, Term, and Class above, then click &quot;Get Broadsheet&quot; to generate the report.
            </p>
          </Card>
        )
      )}

      {activeTab === "position" && (
        yearlyData.length > 0 ? (
          <Card>
            <CardHeader title="Academic Year Position Summary" />
            <CardBody className="overflow-x-auto p-0">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Surname</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 text-center">First Term</th>
                    <th className="px-4 py-3 text-center">Second Term</th>
                    <th className="px-4 py-3 text-center">Third Term</th>
                    <th className="px-4 py-3 text-center">Total Score</th>
                    <th className="px-4 py-3 text-center">Average</th>
                    <th className="px-4 py-3 text-center">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {yearlyData.map((student, index) => (
                    <tr key={index} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3 text-ink-500">{index + 1}</td>
                      <td className="px-4 py-3 text-ink-700 font-medium">{student.level?.toUpperCase() || "—"}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{student.surname}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{student.name}</td>
                      <td className="px-4 py-3 text-center text-ink-700">{student.termlyScores?.FIRST ?? "-"}</td>
                      <td className="px-4 py-3 text-center text-ink-700">{student.termlyScores?.SECOND ?? "-"}</td>
                      <td className="px-4 py-3 text-center text-ink-700">{student.termlyScores?.THIRD ?? "-"}</td>
                      <td className="px-4 py-3 text-center font-bold text-ink-900">{student.termlyScores?.TOTAL ?? "-"}</td>
                      <td className="px-4 py-3 text-center font-semibold text-brand-700">
                        {student.average ? `${Number(student.average).toFixed(2)}%` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{student.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ) : (
          <Card className="p-8 text-center text-ink-500">
            <TrendingUp className="mx-auto mb-3 h-10 w-10 text-ink-300" />
            <p className="font-medium text-ink-700">Academic Position View</p>
            <p className="mt-1 text-xs text-ink-400">
              Select Academic Year and Class above, then click &quot;Get Academic Position&quot; to view yearly rankings.
            </p>
          </Card>
        )
      )}
    </div>
  );
};

export default StudentPerformance;


