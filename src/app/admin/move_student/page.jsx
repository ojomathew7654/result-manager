"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Users, ArrowRight, UserCheck, RefreshCw, Layers } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";
import { useSonner } from "@/lib/useSonner";

const MoveStudents = () => {
  const { customSonner } = useSonner();
  const { data: session } = useSession();
  const [levels, setLevels] = useState([]);
  const [variants, setVariants] = useState([]);

  const [academicYear, setAcademicYear] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [variant, setVariant] = useState("");

  const [nextAcademicYear, setNextAcademicYear] = useState("");
  const [nextLevel, setNextLevel] = useState("");
  const [nextVariant, setNextVariant] = useState("");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setLevels(data.classes || []);
        setVariants(data.variants || []);
      } catch (err) {
        console.error("Error fetching school data:", err);
      }
    };

    if (session?.schoolId) {
      fetchSchoolData();
    }
  }, [session]);

  const fetchStudents = async () => {
    if (!academicYear || !selectedLevel) {
      customSonner({ type: "error", text: "Please select both Academic Year and Level." });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.get("/api/move_students", {
        params: {
          schoolId: session.schoolId,
          level: selectedLevel,
          variant,
          academicYear,
        },
      });

      setStudents(res.data.students || []);
      if (res.data.students?.length === 0) {
        customSonner({ type: "info", text: "No students found for the selected criteria." });
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      customSonner({
        type: "error",
        text: err.response?.data?.error || "Failed to fetch students.",
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteStudents = async () => {
    if (!nextAcademicYear || !nextLevel) {
      customSonner({
        type: "error",
        text: "Please select both Next Academic Year and Next Level.",
      });
      return;
    }

    if (academicYear === nextAcademicYear && selectedLevel === nextLevel) {
      customSonner({
        type: "error",
        text: "Next level and academic year must be different from current ones.",
      });
      return;
    }

    setPromoting(true);

    try {
      const body = {
        schoolId: session.schoolId,
        level: selectedLevel,
        variant,
        academicYear,
        nextLevel,
        nextAcademicYear,
      };

      const res = await axios.put("/api/move_students", body);
      customSonner({
        type: "success",
        text: res.data.message || "Students promoted successfully.",
      });
      setStudents([]);
    } catch (err) {
      console.error("Promote students error:", err);
      customSonner({
        type: "error",
        text: err.response?.data?.error || "Error occurred while promoting students.",
      });
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        dark={false}
        title="Move Students to Next Level"
        subtitle="Batch promote or transition student records to a new level and academic year."
      />

      {/* Card 1: Selection Filters */}
      <Card>
        <CardHeader
          title="Current Student Placement"
          subtitle="Filter current class roster to promote"
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Academic Year" required>
              <Select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="">Select Academic Year</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </Select>
            </Field>

            <Field label="Current Level" required>
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">Select Level</option>
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Variant (Optional)">
              <Select value={variant} onChange={(e) => setVariant(e.target.value)}>
                <option value="">Select Variant</option>
                {variants.map((v) => (
                  <option key={v} value={v}>
                    {v.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={fetchStudents}
              disabled={loading || promoting}
              variant="primary"
              icon={Users}
            >
              {loading ? "Fetching Students..." : "Get Students"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Card 2: Student List Preview */}
      {loading ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
          <Spinner />
          <p className="text-sm text-ink-500">Fetching students for promotion...</p>
        </div>
      ) : (
        students.length > 0 && (
          <Card>
            <CardHeader
              title={`Students Found (${students.length})`}
              subtitle="Review students before confirming promotion"
            />
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-60 overflow-y-auto p-1">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border border-ink-100 bg-ink-50/50 p-2.5 text-xs text-ink-800"
                  >
                    <UserCheck size={14} className="text-brand-600 shrink-0" />
                    <span className="font-medium truncate">
                      {s.name} {s.surname}
                    </span>
                    <span className="text-ink-400 text-[11px]">({s.level})</span>
                  </div>
                ))}
              </div>

              <hr className="border-ink-100" />

              {/* Promotion Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Target Level & Academic Year
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Next Academic Year" required>
                    <Select
                      value={nextAcademicYear}
                      onChange={(e) => setNextAcademicYear(e.target.value)}
                    >
                      <option value="">Select Next Year</option>
                      <option value="2024/2025">2024/2025</option>
                      <option value="2025/2026">2025/2026</option>
                      <option value="2026/2027">2026/2027</option>
                    </Select>
                  </Field>

                  <Field label="Next Level" required>
                    <Select
                      value={nextLevel}
                      onChange={(e) => setNextLevel(e.target.value)}
                    >
                      <option value="">Select Next Level</option>
                      {levels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl.toUpperCase()}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Next Variant (Optional)">
                    <Select
                      value={nextVariant}
                      onChange={(e) => setNextVariant(e.target.value)}
                    >
                      <option value="">Select Next Variant</option>
                      {variants.map((v) => (
                        <option key={v} value={v}>
                          {v.toUpperCase()}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={promoteStudents}
                    disabled={promoting}
                    variant="primary"
                    icon={ArrowRight}
                    size="lg"
                  >
                    {promoting ? "Promoting..." : `Promote ${students.length} Students`}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )
      )}
    </div>
  );
};

export default MoveStudents;
