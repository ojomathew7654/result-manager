"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Spinner from "@/components/Spinner/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useSonner } from "@/lib/useSonner";
import { BarChart3, Award } from "lucide-react";

const StudentPerformance = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [termType, setTermType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [yearlyData, setYearlyData] = useState([]);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState({});
  const [levelAndVariant, setLevelAndVariant] = useState(null);
  const { customSonner } = useSonner();

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data || {});
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  const getTermlyPerformance = async () => {
    if (!academicYear || !selectedClass || !termType) {
      customSonner({ type: "error", text: "Please select Academic Year, Term, and Class before fetching broadsheet." });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get("/api/student/performance", {
        params: {
          selectedClass,
          schoolId: session.schoolId,
          termType,
          academicYear,
        },
      });

      const lvlVar = (data || []).map(({ level, variant }) => ({
        level,
        variant,
      }));

      setLevelAndVariant(lvlVar[0] || null);

      const sanitizedStudents = (data || []).map(({ level, variant, ...rest }) => rest);
      setStudents(sanitizedStudents);
    } catch (error) {
      console.error("Error fetching termly performance:", error);
      customSonner({ type: "error", text: "Failed to fetch broadsheet data." });
    }
    setLoading(false);
  };

  const getYeralyPerformance = async () => {
    if (!academicYear || !selectedClass) {
      customSonner({ type: "error", text: "Please select Academic Year and Class before fetching yearly positions." });
      return;
    }
    setLoading(true);
    try {
      const encodedAcademicYear = encodeURIComponent(academicYear);
      const [level, variant] = selectedClass.split("-");
      const { data } = await axios.get(
        `/api/student/performance/yearly/${encodedAcademicYear}-${session?.schoolId}-${level}-${variant}`
      );
      setYearlyData(data || []);
    } catch (error) {
      console.error("Error fetching yearly performance:", error);
      customSonner({ type: "error", text: "Failed to fetch yearly academic positions." });
    }
    setLoading(false);
  };

  const handleAcademicYearChange = (event) => {
    setAcademicYear(event.target.value);
  };

  const handleTermChange = (event) => {
    setTermType(event.target.value);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-white">
        <Spinner />
        <p className="text-sm font-medium text-ink-300">Loading student performance...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  const subjectKeys = Array.from(
    new Set(
      students.flatMap((student) =>
        Object.keys(student).filter(
          (key) =>
            !["surname", "name", "totalScore", "average", "position"].includes(key)
        )
      )
    )
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Performance & Broadsheet"
        subtitle="Select term, academic year, and class to view class broadsheet matrix and yearly academic positions."
      />

      {/* Filter Options Card */}
      <Card>
        <CardHeader
          title="Performance Filters"
          subtitle="Choose term, session, and class to load broadsheet or position tables."
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Term" htmlFor="termSelect">
              <Select id="termSelect" value={termType} onChange={handleTermChange}>
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
              <Select id="classSelect" value={selectedClass} onChange={handleClassChange}>
                <option value="" disabled>
                  Select Class
                </option>
                {session?.teacherOf?.map((className) => (
                  <option key={className} value={className}>
                    {className.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              onClick={getTermlyPerformance}
              disabled={loading}
              icon={BarChart3}
            >
              {loading ? "Please wait..." : "Get Broadsheet"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={getYeralyPerformance}
              disabled={loading}
              icon={Award}
            >
              {loading ? "Please wait..." : "Get Academic Positions"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Termly Broadsheet Display */}
      {students.length > 0 && (
        <Card>
          <CardHeader
            title={`${levelAndVariant?.level?.toUpperCase() || ""} ${
              levelAndVariant?.variant ? " - " + levelAndVariant.variant.toUpperCase() : ""
            } Broadsheet`}
            subtitle={`${termType} Term, Academic Session`}
          />
          <CardBody className="p-0">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-ink-100 bg-ink-50/70 p-6 text-center sm:text-left">
              {school?.logo && (
                <div className="relative h-20 w-24 overflow-hidden rounded-xl border border-ink-200 bg-white shrink-0">
                  <Image
                    src={school.logo}
                    alt="School logo"
                    fill
                    className="object-contain p-1"
                  />
                </div>
              )}
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-ink-900">
                  {school?.fullName || school?.name}
                </h3>
                {school?.name === "CRYSTAL BRAINS SCHOOL" && (
                  <p className="text-xs font-semibold text-brand-600">BRITISH AND MONTESSORI</p>
                )}
                {school?.motto && (
                  <p className="text-xs text-ink-500 font-medium">MOTTO: {school.motto.toUpperCase()}</p>
                )}
                <p className="text-xs font-semibold text-ink-700 mt-1">
                  {`${levelAndVariant?.level?.toUpperCase() || ""}${
                    levelAndVariant?.variant ? " - " + levelAndVariant.variant.toUpperCase() : ""
                  } Broadsheet – ${termType} Term`}
                </p>
              </div>
            </div>

            {/* Broadsheet Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-ink-100 bg-ink-100/50 text-ink-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">#</th>
                    <th className="px-3 py-3 min-w-[110px]">Surname</th>
                    <th className="px-3 py-3 min-w-[110px]">Name</th>
                    {subjectKeys.map((subject) => {
                      const trimmed = subject.trim();
                      const isMath = trimmed.toLowerCase() === "mathematics" || trimmed.toLowerCase() === "math";
                      const display = isMath ? "MATH" : trimmed.toUpperCase();
                      return (
                        <th key={subject} className="px-2 py-3 text-center min-w-[70px]" title={trimmed}>
                          {display}
                        </th>
                      );
                    })}
                    <th className="px-3 py-3 w-16 text-center bg-brand-50/50 text-brand-900 font-bold">Total</th>
                    <th className="px-3 py-3 w-16 text-center bg-brand-50/50 text-brand-900 font-bold">Avg</th>
                    <th className="px-3 py-3 w-16 text-center bg-brand-100/50 text-brand-900 font-bold">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {students.map((student, index) => (
                    <tr key={index} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-3 py-2.5 text-center text-ink-400 font-medium">{index + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink-900">{student.surname || "-"}</td>
                      <td className="px-3 py-2.5 text-ink-700">{student.name || "-"}</td>

                      {subjectKeys.map((subject) => (
                        <td key={subject} className="px-2 py-2.5 text-center text-ink-700">
                          {student[subject] ?? "-"}
                        </td>
                      ))}

                      <td className="px-3 py-2.5 text-center font-bold text-ink-900 bg-brand-50/20">
                        {student.totalScore ?? "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-brand-700 bg-brand-50/20">
                        {student.average ? `${Number(student.average).toFixed(2)}%` : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-600 bg-amber-50/30">
                        {student.position ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Yearly Position Table Display */}
      {yearlyData.length > 0 && (
        <Card>
          <CardHeader
            title="Academic Session Yearly Positions"
            subtitle="Overall academic position summary across first, second, and third terms."
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-ink-100 bg-ink-50 text-ink-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">#</th>
                    <th className="px-3 py-3">Level</th>
                    <th className="px-3 py-3">Surname</th>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3 text-center">First Term</th>
                    <th className="px-3 py-3 text-center">Second Term</th>
                    <th className="px-3 py-3 text-center">Third Term</th>
                    <th className="px-3 py-3 text-center font-bold">Total Score</th>
                    <th className="px-3 py-3 text-center font-bold">Average</th>
                    <th className="px-3 py-3 text-center font-bold">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {yearlyData.map((student, index) => (
                    <tr key={index} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-3 py-2.5 text-center text-ink-400 font-medium">{index + 1}</td>
                      <td className="px-3 py-2.5 uppercase font-medium text-ink-600">{student.level || "-"}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink-900">{student.surname || "-"}</td>
                      <td className="px-3 py-2.5 text-ink-700">{student.name || "-"}</td>
                      <td className="px-3 py-2.5 text-center text-ink-700">{student.termlyScores?.FIRST ?? "-"}</td>
                      <td className="px-3 py-2.5 text-center text-ink-700">{student.termlyScores?.SECOND ?? "-"}</td>
                      <td className="px-3 py-2.5 text-center text-ink-700">{student.termlyScores?.THIRD ?? "-"}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-ink-900">{student.termlyScores?.TOTAL ?? "-"}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-brand-700">
                        {student.average ? `${Number(student.average).toFixed(2)}%` : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-600">{student.position || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default StudentPerformance;
