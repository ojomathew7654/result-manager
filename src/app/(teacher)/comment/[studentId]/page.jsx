"use client";

import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useSonner } from "@/lib/useSonner";
import { ArrowLeft, Save } from "lucide-react";

const defaultPsychomotor = [
  { trait: "Handwriting", rating: "Good" },
  { trait: "Drawing", rating: "Very Good" },
  { trait: "Crafts", rating: "Excellent" },
  { trait: "Sports", rating: "Very Good" },
  { trait: "Coordination", rating: "Very Good" },
];

const defaultEffectiveTraits = [
  { trait: "Punctuality", rating: "Excellent" },
  { trait: "Attendance", rating: "Very Good" },
  { trait: "Class Participation", rating: "Good" },
  { trait: "Homework Completion", rating: "Excellent" },
  { trait: "Behavior", rating: "Good" },
  { trait: "Attentiveness", rating: "Excellent" },
  { trait: "Teamwork", rating: "Very Good" },
  { trait: "Leadership", rating: "Excellent" },
  { trait: "Communication Skills", rating: "Good" },
  { trait: "Creativity", rating: "Very Good" },
  { trait: "Problem-Solving", rating: "Excellent" },
];

const gradeComments = [
  { grade: "A+", scoreRange: "95-100", comment: "An exceptional result! Your hard work truly shines. Keep it up!" },
  { grade: "A", scoreRange: "90-94.9", comment: "Excellent work! Your dedication is impressive. Keep pushing your limits!" },
  { grade: "A-", scoreRange: "85-89.9", comment: "Very good job! You've shown great understanding. Aim even higher!" },
  { grade: "B+", scoreRange: "80-84.9", comment: "Great effort! You've made solid progress. Keep challenging yourself!" },
  { grade: "B", scoreRange: "75-79.9", comment: "Good job! Your progress is clear. Stay focused and keep improving!" },
  { grade: "B-", scoreRange: "70-74.9", comment: "Well done! You've shown improvement. Continue building on your strengths!" },
  { grade: "C+", scoreRange: "65-69.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "C", scoreRange: "60-64.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "C-", scoreRange: "55-59.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "D+", scoreRange: "50-54.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "D", scoreRange: "45-49.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "D-", scoreRange: "40-44.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "E+", scoreRange: "35-39.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "E", scoreRange: "30-34.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
  { grade: "F", scoreRange: "0-29.9", comment: "Nice effort! You've made progress. Keep working hard and seek help when needed." },
];

const defaultFormTeacherRemarks = [
  "is active in class and relates well with others in the class.",
  "is a hardworking student who strives to excel.",
  "shows enthusiasm in learning and works well with peers.",
  "is an attentive learner who actively participates in class discussions.",
  "is consistent in completing assignments and projects on time.",
  "demonstrates good leadership skills and responsibility.",
  "exhibits creativity and a keen interest in learning new things.",
  "is respectful and shows good manners in class.",
  "works collaboratively with others and contributes positively to group tasks.",
  "is diligent in studies and always eager to improve.",
];

function getRandomFormTeacherRemark() {
  const randomIndex = Math.floor(Math.random() * defaultFormTeacherRemarks.length);
  return defaultFormTeacherRemarks[randomIndex];
}

function hasMoreThanOneS(str) {
  return (str || "").split("s").length - 1 > 1;
}

function getCommentForAverage(average) {
  for (const gradeComment of gradeComments) {
    const [min, max] = gradeComment.scoreRange.split("-").map(Number);
    if (average >= min && average <= max) {
      return gradeComment.comment;
    }
  }
  return "No comment available.";
}

const EachStudentResult = ({ params }) => {
  const { studentId } = params;
  const router = useRouter();
  const { customSonner } = useSonner();

  const [schoolName, setSchoolName] = useState("");
  const [student, setStudent] = useState(null);
  const [formTeacherName, setFormTeacherName] = useState("");
  const [psychomotor, setPsychomotor] = useState(defaultPsychomotor);
  const [effectiveTraits, setEffectiveTraits] = useState(defaultEffectiveTraits);
  const [formTeacherRemark, setFormTeacherRemark] = useState("");
  const [headOfSchoolRemark, setHeadOfSchoolRemark] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) {
        redirect("/");
      }
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/student/${studentId}`);
        const encodedAcademicYear = encodeURIComponent("2025/2026");

        const { data } = await axios.get(
          hasMoreThanOneS(res.data.level)
            ? `/api/student/result/ssClass/${encodedAcademicYear}-${studentId}-FIRST`
            : `/api/student/result/${encodedAcademicYear}-${studentId}-FIRST`
        );

        setStudent(data.student);
        setSchoolName(data.student?.school?.name || "");
        setFormTeacherName(data.student?.formTeacherName || "");
        setFormTeacherRemark(
          data.student?.formTeacherRemark ||
            (data.student?.name ? `${data.student.name} ${getRandomFormTeacherRemark()}` : "")
        );

        setHeadOfSchoolRemark(
          data.student?.headOfSchoolRemark ||
            getCommentForAverage(data.studentFinalAverage)
        );

        const psychomotorTraits = (data.student?.traitRatings || []).filter(
          (tr) => tr.type === "Psychomotor"
        );
        const effectiveTraitsList = (data.student?.traitRatings || []).filter(
          (tr) => tr.type === "Effective"
        );

        setPsychomotor(
          defaultPsychomotor.map(
            (defaultTrait) =>
              psychomotorTraits.find(
                (trait) => trait.trait === defaultTrait.trait
              ) || defaultTrait
          )
        );

        setEffectiveTraits(
          defaultEffectiveTraits.map(
            (defaultTrait) =>
              effectiveTraitsList.find(
                (trait) => trait.trait === defaultTrait.trait
              ) || defaultTrait
          )
        );
      } catch (error) {
        console.error("Error fetching student data", error);
      }
      setIsLoading(false);
    };

    fetchStudent();
  }, [studentId]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const psychomotorWithTypes = psychomotor.map((trait) => ({
        ...trait,
        type: "Psychomotor",
      }));
      const effectiveTraitsWithTypes = effectiveTraits.map((trait) => ({
        ...trait,
        type: "Effective",
      }));

      await axios.patch(`/api/student/result/${studentId}`, {
        formTeacherName,
        formTeacherRemark,
        headOfSchoolRemark,
        traitRatings: [...psychomotorWithTypes, ...effectiveTraitsWithTypes],
      });

      customSonner({ type: "success", text: "Remarks and traits saved successfully!" });
      router.back();
    } catch (error) {
      console.error("Error saving data", error);
      customSonner({ type: "error", text: "Failed to save remarks and traits." });
    }
    setIsLoading(false);
  };

  if (isLoading || !schoolName) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-white">
        <Spinner />
        <p className="text-sm font-medium text-ink-300">Working on student comments, please wait...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Traits & Remarks"
        subtitle={`Student: ${student?.surname || ""} ${student?.name || ""} | Level: ${(student?.level || "").toUpperCase()}`}
        action={
          <Button variant="outline" icon={ArrowLeft} onClick={() => router.back()}>
            Back to Roster
          </Button>
        }
      />

      {/* Main Remarks Section */}
      <Card>
        <CardHeader
          title="General Remarks & Comments"
          subtitle="Form Teacher and Principal / Head of School evaluation comments."
        />
        <CardBody className="space-y-4">
          <Field label="Form Teacher Name" htmlFor="formTeacherName">
            <Input
              id="formTeacherName"
              value={formTeacherName}
              onChange={(e) => setFormTeacherName(e.target.value)}
              placeholder="Enter Form Teacher's full name"
            />
          </Field>

          <Field label="Form Teacher Remarks" htmlFor="formTeacherRemark">
            <textarea
              id="formTeacherRemark"
              rows={3}
              className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={formTeacherRemark}
              onChange={(e) => setFormTeacherRemark(e.target.value)}
              placeholder="Enter form teacher remarks..."
            />
          </Field>

          <Field label="Principal / Head Master Remarks" htmlFor="headOfSchoolRemark">
            <textarea
              id="headOfSchoolRemark"
              rows={3}
              className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={headOfSchoolRemark}
              onChange={(e) => setHeadOfSchoolRemark(e.target.value)}
              placeholder="Enter principal or head master remarks..."
            />
          </Field>
        </CardBody>
      </Card>

      {/* Traits Grid Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Psychomotor Skills */}
        <Card>
          <CardHeader
            title="Psychomotor Skills"
            subtitle="Rate student motor and practical physical skills."
          />
          <CardBody className="space-y-3">
            {psychomotor.map((traitItem, index) => (
              <div key={index} className="flex items-center justify-between gap-3 border-b border-ink-100 pb-2.5 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-ink-700">{traitItem.trait}</span>
                <Input
                  className="w-36 text-xs"
                  value={traitItem.rating}
                  onChange={(e) => {
                    const updated = [...psychomotor];
                    updated[index].rating = e.target.value;
                    setPsychomotor(updated);
                  }}
                  placeholder="e.g. Excellent, Good"
                />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Effective Traits */}
        <Card>
          <CardHeader
            title="Effective Traits"
            subtitle="Rate student behavioral, social, and personal traits."
          />
          <CardBody className="space-y-3">
            {effectiveTraits.map((traitItem, index) => (
              <div key={index} className="flex items-center justify-between gap-3 border-b border-ink-100 pb-2.5 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-ink-700">{traitItem.trait}</span>
                <Input
                  className="w-36 text-xs"
                  value={traitItem.rating}
                  onChange={(e) => {
                    const updated = [...effectiveTraits];
                    updated[index].rating = e.target.value;
                    setEffectiveTraits(updated);
                  }}
                  placeholder="e.g. Excellent, Good"
                />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Save Action Footer */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          icon={Save}
          size="lg"
        >
          {isLoading ? "Saving..." : "Save Student Remarks"}
        </Button>
      </div>
    </div>
  );
};

export default EachStudentResult;
