"use client";
import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";
import styles from "../remark.module.css";
import Spinner from "@/components/Spinner/Spinner";

const EachStudentResult = ({ params }) => {
  const { studentId } = params;
  const defaultPsychomotor = [
    { trait: "Handwriting", rating: "Good" },
    { trait: "Drawing", rating: "Very Good" },
    { trait: "Crafts", rating: "Excellent" },
    { trait: "Sports", rating: "Very Good" },
    // { trait: "Musical Skills", rating: "Good" },
    // { trait: "Dance", rating: "Excellent" },
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
    {
      grade: "A+",
      scoreRange: "95-100",
      comment:
        "An exceptional result! Your hard work truly shines. Keep it up!",
    },
    {
      grade: "A",
      scoreRange: "90-94.9",
      comment:
        "Excellent work! Your dedication is impressive. Keep pushing your limits!",
    },
    {
      grade: "A-",
      scoreRange: "85-89.9",
      comment:
        "Very good job! You've shown great understanding. Aim even higher!",
    },
    {
      grade: "B+",
      scoreRange: "80-84.9",
      comment:
        "Great effort! You've made solid progress. Keep challenging yourself!",
    },
    {
      grade: "B",
      scoreRange: "75-79.9",
      comment:
        "Good job! Your progress is clear. Stay focused and keep improving!",
    },
    {
      grade: "B-",
      scoreRange: "70-74.9",
      comment:
        "Well done! You've shown improvement. Continue building on your strengths!",
    },
    {
      grade: "C+",
      scoreRange: "65-69.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "C",
      scoreRange: "60-64.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "C-",
      scoreRange: "55-59.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "D+",
      scoreRange: "50-54.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "D",
      scoreRange: "45-49.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "D-",
      scoreRange: "40-44.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "E+",
      scoreRange: "35-39.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "E",
      scoreRange: "30-34.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
    {
      grade: "F",
      scoreRange: "0-29.9",
      comment:
        "Nice effort! You've made progress. Keep working hard and seek help when needed.",
    },
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
    const randomIndex = Math.floor(
      Math.random() * defaultFormTeacherRemarks.length,
    );
    return defaultFormTeacherRemarks[randomIndex];
  }
  const [schoolName, setSchoolName] = useState("");
  const [student, setStudent] = useState([]);
  const [formTeacherName, setFormTeacherName] = useState("");
  const [psychomotor, setPsychomotor] = useState(defaultPsychomotor);
  const [effectiveTraits, setEffectiveTraits] = useState(
    defaultEffectiveTraits,
  );
  const [formTeacherRemark, setFormTeacherRemark] = useState("");

  const [headOfSchoolRemark, setHeadOfSchoolRemark] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  function hasMoreThanOneS(str) {
    return str.split("s").length - 1 > 1;
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

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) {
        redirect("/");
      }
      setIsLoading(true); // Set loading state to true while fetching
      try {
        const res = await axios.get(`/api/student/${studentId}`);
        const encodedAcademicYear = encodeURIComponent("2026/2027");

        const { data } = await axios.get(
          hasMoreThanOneS(res.data.level)
            ? `/api/student/result/ssClass/${encodedAcademicYear}-${studentId}-${"FIRST"}`
            : `/api/student/result/${encodedAcademicYear}-${studentId}-${"FIRST"}`,
        );
        setStudent(data.student);
        setSchoolName(data.student.school.name);
        setFormTeacherName(data.student.formTeacherName || "");
        setFormTeacherRemark(
          data.student.formTeacherRemark ||
            data.student.name + " " + getRandomFormTeacherRemark(),
        );

        setHeadOfSchoolRemark(
          data.student.headOfSchoolRemark ||
            getCommentForAverage(data.studentFinalAverage),
        );

        const psychomotorTraits = data.student.traitRatings.filter(
          (tr) => tr.type === "Psychomotor",
        );
        const effectiveTraitsList = data.student.traitRatings.filter(
          (tr) => tr.type === "Effective",
        );

        setPsychomotor(
          defaultPsychomotor.map(
            (defaultTrait) =>
              psychomotorTraits.find(
                (trait) => trait.trait === defaultTrait.trait,
              ) || defaultTrait,
          ),
        );

        setEffectiveTraits(
          defaultEffectiveTraits.map(
            (defaultTrait) =>
              effectiveTraitsList.find(
                (trait) => trait.trait === defaultTrait.trait,
              ) || defaultTrait,
          ),
        );
      } catch (error) {
        console.error("Error fetching student data", error);
      }
      setIsLoading(false); // Set loading state to false after fetching
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
      alert("Data saved successfully");
      router.back();
    } catch (error) {
      console.error("Error saving data", error);
      alert("Failed to save data");
    }
    setIsLoading(false);
  };

  if (!schoolName)
    return (
      <h1 className="waitH1">
        <Spinner /> Working on student comment, please wait...
      </h1>
    );
  console.log(headOfSchoolRemark);

  return (
    <div className={styles.container}>
      <div className={styles.studentRemark}>
        <h2>Student Traits Form</h2>
        <div className={styles.flex}>
          <div className={styles.div1}>
            <div>
              <label>
                Form Teacher Names:
                <input
                  rows={3}
                  value={formTeacherName}
                  onChange={(e) => setFormTeacherName(e.target.value)}
                />
              </label>
            </div>
            <div className={styles.remarkTextarea}>
              <label>
                Form Teacher Remarks:
                <textarea
                  rows={3}
                  value={formTeacherRemark}
                  onChange={(e) => setFormTeacherRemark(e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                Principal/Head Master Remarks:
                <textarea
                  rows={3}
                  value={headOfSchoolRemark}
                  onChange={(e) => setHeadOfSchoolRemark(e.target.value)}
                />
              </label>
            </div>
            <div>
              <h3>Psychomotor Skills</h3>
              {psychomotor.map((trait, index) => (
                <div key={index}>
                  <label>{trait.trait}</label>
                  <input
                    type="text"
                    value={trait.rating}
                    onChange={(e) => {
                      const updatedTraits = [...psychomotor];
                      updatedTraits[index].rating = e.target.value;
                      setPsychomotor(updatedTraits);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.div2}>
            <h3>Effective Traits</h3>
            {effectiveTraits.map((trait, index) => (
              <div key={index}>
                <label>{trait.trait}</label>
                <input
                  type="text"
                  value={trait.rating}
                  onChange={(e) => {
                    const updatedTraits = [...effectiveTraits];
                    updatedTraits[index].rating = e.target.value;
                    setEffectiveTraits(updatedTraits);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={handleSave}
          className={isLoading && styles.disabled}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default EachStudentResult;
