"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import TaskComponent from "@/components/taskComponent/TaskComponent";
import AnswerAssignment from "@/components/AnswerAss/Answer";
import { format } from "date-fns";
import imageCompression from "browser-image-compression";
import { useUploadThing } from "@/utils/uploadthing";
import Spinner from "@/components/Spinner/Spinner";
import { ClipboardList, GraduationCap } from "lucide-react";

const Task = () => {
  const [school, setSchool] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [studentId, setStudentId] = useState(null);
  const [assignmentId, setAssignmentId] = useState(null);
  const [submission, setSubmission] = useState([]);
  const [input, setInput] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const { startUpload } = useUploadThing("imageUploader");
  const [files, setFiles] = useState([]);

  const scrollRef = useRef();

  // Fetch assignments and school data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const storedData = JSON.parse(localStorage.getItem("studentData")) || [];
      setStudentId(storedData.id);
      if (!storedData.id) {
        router.push("/");
        return;
      }
      const cacheKey = `student-tasks-${storedData.id}`;
      const schoolCacheKey = `school-${storedData.schoolId}`;
      const cachedSchool = localStorage.getItem(schoolCacheKey);
      const cachedAssignments = localStorage.getItem(cacheKey);

      if (cachedSchool) setSchool(JSON.parse(cachedSchool));
      if (cachedAssignments) {
        setAssignments(JSON.parse(cachedAssignments));
        setLoading(false);
      }

      const [schoolRes, assignmentsRes] = await Promise.all([
        axios.get(`/api/school/${storedData.schoolId}`, { timeout: 8000 }),
        axios.get(
          `/api/assignments/class/${storedData.schoolId}-${storedData.level}-${storedData.id}`,
          { timeout: 8000 }
        ),
      ]);

      setSchool(schoolRes.data);
      setAssignments(assignmentsRes.data);
      localStorage.setItem(schoolCacheKey, JSON.stringify(schoolRes.data));
      localStorage.setItem(cacheKey, JSON.stringify(assignmentsRes.data));
    } catch (err) {
      console.log(err);
      setError("Unable to refresh your tasks. Showing saved tasks if available.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // Handle assignment answering logic
  const handleAnswerAssignment = (id, ass) => {
    setAssignmentId(id);
    const search = ass.find((a) => a.id == id);
    setInput(search.questions);
    setSubmission(new Array(search.questions.length).fill(""));

    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAnswerChange = (index, value) => {
    const updatedSubmission = [...submission];
    updatedSubmission[index] = value; // Update the specific answer in the array
    setSubmission(updatedSubmission);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submission.some((answer) => answer.trim() === "")) {
      alert("Please complete all questions before submitting.");
      return;
    }
    try {
      setIsSubmitting(true);
      const submittedDate = format(Date.now(), "EEE, MMM d, yyyy");

      let uploadedImagesUrls = [];
      console.log(files);
      // Check if there are files to upload
      if (files && files.length > 0) {
        // Compress each file individually
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
        // Upload each compressed file and get URLs
        for (const compressedFile of compressedFiles) {
          const uploadedImages = await startUpload([compressedFile]); // Upload one at a time
          if (!uploadedImages || uploadedImages.length === 0) {
            alert("Image upload failed. Please try again.");
            setLoading(false);
            return;
          }
          uploadedImagesUrls.push(uploadedImages[0].url); // Append each URL
        }
      }

      const { data } = await axios.post("/api/assignments/submit", {
        assignmentId,
        studentId,
        submission,
        submittedDate,
        images: uploadedImagesUrls,
      });
      alert(data.message);
      setFiles([]);
      setImageUrls([]);
      setAssignmentId(null);
      setSubmission([]);
      await fetchData();
    } catch (err) {
      console.log(err);
      alert("Network error: unable to submit");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            {school.logo ? <img src={school.logo} alt="School logo" className="h-full w-full rounded-xl object-contain" /> : <GraduationCap size={22} />}
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-ink-900">My tasks</p>
            <p className="text-sm text-ink-400">Assignments from your teachers.</p>
          </div>
        </header>

      {error && assignments.length > 0 ? <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
      {loading && assignments.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-lg font-medium text-ink-600 shadow-card"><Spinner /> Please wait for a moment</div>
      ) : assignments.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white px-6 text-center shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><ClipboardList size={22} /></div>
          <h1 className="font-medium text-ink-900">{error ? "Tasks are unavailable right now." : "You have no tasks."}</h1>
          <p className="text-sm text-ink-400">{error || "New assignments will appear here when your teacher posts them."}</p>
        </div>
      ) : (
        <>
          <TaskComponent
            assignments={assignments}
            handleAnswerAssignment={handleAnswerAssignment}
            school={school}
            teacherPage={false}
            adminPage={false}
          />
          {assignmentId && (
            <AnswerAssignment
              submission={submission}
              handleAnswerChange={handleAnswerChange}
              handleSubmit={handleSubmit}
              scrollRef={scrollRef}
              input={input}
              imageUrls={imageUrls}
              setImageUrls={setImageUrls}
              setFiles={setFiles}
              isSubmitting={isSubmitting}
            />
          )}
        </>
      )}
      </div>
    </main>
  );
};

export default Task;
