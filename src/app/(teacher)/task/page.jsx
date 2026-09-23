"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import imageCompression from "browser-image-compression";
import { useUploadThing } from "@/utils/uploadthing";
import { FileUploaderArray } from "@/utils/FileUploader/FileUploader";
import { Plus, Trash2, Upload, Check } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";
import TaskComponent from "@/components/taskComponent/TaskComponent";
import { useSonner } from "@/lib/useSonner";

const TeacherTask = () => {
  const { customSonner } = useSonner();
  const [taskDetails, setTaskDetails] = useState({
    instructions: "",
    givenDate: "",
    submissionDate: "",
    type: "",
    questions: [""],
  });
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState(false);
  const { startUpload } = useUploadThing("imageUploader");
  const [selectedClass, setSelectedClass] = useState("");
  const { data: session, status: sessionStatus } = useSession();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [scores, setScores] = useState(
    Array(taskDetails.questions.length).fill("")
  );
  const [editMode, setEditMode] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState(null);
  const [editAssignment, setEditAssignment] = useState(null);
  const scrollRef = useRef();
  const [school, setSchool] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);

  const fetchAssignments = React.useCallback(async () => {
    if (!session?.userId) return;
    try {
      const { data } = await axios.get(`/api/assignments/${session.userId}`);
      setAssignments(data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  }, [session?.userId]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchool(data);
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    };

    if (session?.schoolId) {
      fetchSchoolData();
      fetchAssignments();
    }
  }, [session, fetchAssignments]);

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;
    try {
      const { data } = await axios.delete(`/api/assignments/${id}`);
      customSonner({ type: "success", text: data.message });
      setAssignments(assignments.filter((ass) => ass.id !== id));
    } catch (err) {
      console.error(err);
      customSonner({ type: "error", text: "Error deleting assignment." });
    }
  };

  const handleScoreChange = (index, value) => {
    const updatedScores = [...scores];
    updatedScores[index] = value;
    setScores(updatedScores);
  };

  const handleEditAssignment = (assignment) => {
    setEditMode(true);
    setEditAssignmentId(assignment.id);
    setEditAssignment(assignment);
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });

    setTaskDetails({
      instructions: assignment.instructions,
      givenDate: format(new Date(assignment.givenDate), "yyyy-MM-dd"),
      submissionDate: format(new Date(assignment.submissionDate), "yyyy-MM-dd"),
      type: assignment.title.split(" ").pop().toUpperCase(),
      questions: assignment.questions,
    });
    setSelectedClass(assignment.level);
    setScores(assignment.scores || Array(assignment.questions.length).fill(""));
  };

  const generateTitle = () => {
    if (editMode && editAssignmentId) {
      return editAssignment?.title || "Assignment Title will appear here";
    }

    if (!editMode && selectedClass && selectedSubject && taskDetails.type) {
      return `${selectedClass} ${selectedSubject} ${taskDetails.type.toLowerCase()}`;
    }

    return "Assignment Title will appear here";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails({ ...taskDetails, [name]: value });
  };

  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...taskDetails.questions];
    updatedQuestions[index] = value;
    setTaskDetails({ ...taskDetails, questions: updatedQuestions });
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const addQuestionField = () => {
    setTaskDetails({
      ...taskDetails,
      questions: [...taskDetails.questions, ""],
    });
    setScores([...scores, ""]);
  };

  const removeQuestionField = () => {
    if (taskDetails.questions.length > 1) {
      const updatedQuestions = taskDetails.questions.slice(0, -1);
      setTaskDetails({ ...taskDetails, questions: updatedQuestions });
      setScores(scores.slice(0, -1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const generatedTitle = generateTitle();
    setLoading(true);

    try {
      let uploadedImagesUrls = [];

      if (files && files.length > 0) {
        const compressedFiles = await Promise.all(
          files.map(async (file) => {
            let compressedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1024,
              useWebWorker: true,
            });
            while (compressedFile.size > 1 * 1024 * 1024) {
              compressedFile = await imageCompression(compressedFile, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
              });
            }
            return compressedFile;
          })
        );

        for (const compressedFile of compressedFiles) {
          const uploadedImages = await startUpload([compressedFile]);
          if (!uploadedImages || uploadedImages.length === 0) {
            customSonner({ type: "error", text: "Image upload failed. Please try again." });
            setLoading(false);
            return;
          }
          uploadedImagesUrls.push(uploadedImages[0].url);
        }
      }

      const assignmentData = {
        ...taskDetails,
        scores,
        title: generatedTitle,
        level: selectedClass.split("-")[0],
        teacherId: session?.userId,
        teacherName: session?.name,
        schoolId: session.schoolId,
        images: uploadedImagesUrls,
      };

      let data;
      if (editMode) {
        const response = await axios.put(
          `/api/assignments/${editAssignmentId}`,
          assignmentData
        );
        data = response.data;
        setEditMode(false);
        setEditAssignmentId(null);
        setEditAssignment(null);
      } else {
        const response = await axios.post("/api/assignments", assignmentData);
        data = response.data;
      }

      customSonner({ type: "success", text: data.message });

      setTaskDetails({
        instructions: "",
        givenDate: "",
        submissionDate: "",
        type: "ASSIGNMENT",
        questions: [""],
      });
      setScores([]);
      setFiles([]);
      setImageUrls([]);
      setSelectedClass("");
      setSelectedSubject("");
      await fetchAssignments();
    } catch (err) {
      console.error(err);
      customSonner({ type: "error", text: "Error when submitting assignment." });
    } finally {
      setLoading(false);
    }
  };

  function getSubject() {
    if (!editMode) return;
    const regex = /\b[a-zA-Z]+[ ]?\d+\b/;
    const match = editAssignment?.title?.match(regex);
    if (match) {
      const remainingString = editAssignment?.title
        ?.replace(match[0], "")
        .trim();
      const words = remainingString.split(/\s+/);
      const subject = words.slice(0, -1).join(" ");
      return subject;
    }
    return null;
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm font-medium text-ink-500">Please wait...</p>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") redirect("/");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6" ref={scrollRef}>
      <PageHeader
        title="Task & Assignment Creator"
        subtitle="Manage online homework, projects, and assignments for your classes."
      />

      {/* Form Card */}
      {assignments.length >= 30 ? (
        <Card>
          <CardBody className="py-8 text-center text-rose-600">
            <h3 className="text-base font-bold">Assignment Limit Reached (30 Tasks)</h3>
            <p className="mt-1 text-xs text-ink-500">
              You cannot create more than 30 assignments at a time. Please delete existing assignments to create a new one.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={editMode ? "Edit Assignment" : "Create New Assignment"}
            subtitle={
              <span className="font-semibold text-brand-600">
                Generated Title: {generateTitle()}
              </span>
            }
          />
          <CardBody className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Basic Filters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Field label="Select Class" required>
                  <Select
                    value={selectedClass}
                    onChange={handleClassChange}
                    required
                  >
                    {!selectedClass && (
                      <option value="" disabled>
                        Select class
                      </option>
                    )}
                    {selectedClass ? (
                      <option key={selectedClass} value={selectedClass}>
                        {selectedClass}
                      </option>
                    ) : (
                      session?.classes?.map((classItem) => (
                        <option key={classItem} value={classItem}>
                          {classItem}
                        </option>
                      ))
                    )}
                  </Select>
                </Field>

                <Field label="Select Subject" required>
                  <Select
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    required
                  >
                    {!getSubject() && (
                      <option value="" disabled>
                        Select subject
                      </option>
                    )}
                    {getSubject() ? (
                      <option key={getSubject()} value={getSubject()}>
                        {getSubject()}
                      </option>
                    ) : (
                      session?.subjects?.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))
                    )}
                  </Select>
                </Field>

                <Field label="Assignment Type" required>
                  <Select
                    name="type"
                    value={taskDetails.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="MID_TERM_ASSIGNMENT">Mid Term Assignment</option>
                    <option value="HOLIDAY_ASSIGNMENT">Holiday Assignment</option>
                    <option value="PROJECT">Project</option>
                    <option value="HOLIDAY_PROJECT">Holiday Project</option>
                  </Select>
                </Field>

                <Field label="Given Date" required>
                  <Input
                    type="date"
                    name="givenDate"
                    value={taskDetails.givenDate}
                    onChange={handleInputChange}
                    required
                  />
                </Field>

                <Field label="Submission Due Date" required>
                  <Input
                    type="date"
                    name="submissionDate"
                    value={taskDetails.submissionDate}
                    onChange={handleInputChange}
                    required
                  />
                </Field>
              </div>

              {/* Instructions */}
              <Field label="Instructions" required>
                <textarea
                  name="instructions"
                  placeholder="Enter assignment instructions for students..."
                  value={taskDetails.instructions}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-ink-200 bg-white p-3 text-sm text-ink-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </Field>

              {/* Dynamic Questions & Marks */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                  Questions & Mark Allocations
                </h4>

                <div className="space-y-4">
                  {taskDetails.questions.map((question, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 rounded-lg border border-ink-200 bg-white p-3 sm:grid-cols-4"
                    >
                      <div className="sm:col-span-3">
                        <Field label={`Question ${index + 1}`} required>
                          <textarea
                            id={`question-${index}`}
                            value={question}
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                            placeholder={`Enter question ${index + 1}...`}
                            required
                            rows={2}
                            className="w-full rounded-lg border border-ink-200 bg-white p-2.5 text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          />
                        </Field>
                      </div>

                      <div className="sm:col-span-1">
                        <Field label="Max Mark" required>
                          <Input
                            type="number"
                            value={scores[index] || ""}
                            placeholder="e.g. 10"
                            onChange={(e) => handleScoreChange(index, e.target.value)}
                            min="0"
                            max="100"
                            required
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={addQuestionField}
                    >
                      Add Question
                    </Button>

                    {taskDetails.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={removeQuestionField}
                      >
                        Remove Last
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant={upload ? "subtle" : "outline"}
                    size="sm"
                    icon={Upload}
                    onClick={() => setUpload(!upload)}
                  >
                    {!upload ? "Attach Image" : "Cancel Image Attachment"}
                  </Button>
                </div>
              </div>

              {/* Uploadthing File Attachment Component */}
              {upload && (
                <div className="rounded-xl border border-dashed border-brand-300 bg-brand-50/30 p-4">
                  <FileUploaderArray
                    imageUrls={imageUrls}
                    onFieldChange={setImageUrls}
                    setFiles={setFiles}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  icon={Check}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {loading ? "Submitting Assignment..." : editMode ? "Update Assignment" : "Submit Assignment"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Existing Assignments List using TaskComponent */}
      <TaskComponent
        teacherPage={true}
        assignments={assignments}
        school={school}
        handleDeleteAssignment={handleDeleteAssignment}
        handleEditAssignment={handleEditAssignment}
      />
    </div>
  );
};

export default TeacherTask;
