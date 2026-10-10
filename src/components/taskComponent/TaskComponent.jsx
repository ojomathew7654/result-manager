"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Eye,
  EyeOff,
  Calendar,
  User,
  BookOpen,
  FileText,
  Pencil,
  Trash2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  X,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const TaskComponent = ({
  assignments = [],
  school,
  handleDeleteAssignment,
  handleAnswerAssignment,
  handleEditAssignment,
  teacherPage,
  adminPage,
}) => {
  const pathname = usePathname();
  const pathSegments = pathname ? pathname.split("/") : [];
  const teacherId = pathSegments[3];
  const [review, setReview] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const zoomIn = () => setZoomLevel((prev) => prev + 0.5);
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const startPosition = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
    setZoomLevel(1.5);
    setPosition({ x: 0, y: 0 });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const scaledWidth = containerWidth * zoomLevel;
    const scaledHeight = containerHeight * zoomLevel;
    setIsDraggable(
      scaledWidth > window.innerWidth || scaledHeight > window.innerHeight
    );
  }, [zoomLevel]);

  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    e.preventDefault();
    setIsDragging(true);
    startPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = (e.clientX - startPosition.current.x) / zoomLevel;
    const deltaY = (e.clientY - startPosition.current.y) / zoomLevel;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const maxX = Math.max(
      (containerWidth * zoomLevel - window.innerWidth) / 2,
      0
    );
    const maxY = Math.max(
      (containerHeight * zoomLevel - window.innerHeight) / 2,
      0
    );

    setPosition((prevPosition) => ({
      x: Math.min(maxX, Math.max(prevPosition.x + deltaX, -maxX)),
      y: Math.min(maxY, Math.max(prevPosition.y + deltaY, -maxY)),
    }));
    startPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (!isDraggable) return;
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    startPosition.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = (touch.clientX - startPosition.current.x) / zoomLevel;
    const deltaY = (touch.clientY - startPosition.current.y) / zoomLevel;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const maxX = Math.max(
      (containerWidth * zoomLevel - window.innerWidth) / 2,
      0
    );
    const maxY = Math.max(
      (containerHeight * zoomLevel - window.innerHeight) / 2,
      0
    );

    setPosition((prevPosition) => ({
      x: Math.min(maxX, Math.max(prevPosition.x + deltaX, -maxX)),
      y: Math.min(maxY, Math.max(prevPosition.y + deltaY, -maxY)),
    }));

    startPosition.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!assignments || assignments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {assignments.map((assignment) => {
        const totalScore = assignment.studentScore
          ? assignment.studentScore.reduce((acc, curr) => acc + curr, 0)
          : 0;

        const hasNonZeroScore = assignment.studentScore
          ? assignment.studentScore.some((score) => score > 0)
          : false;

        return (
          <Card key={assignment.id} className="overflow-hidden shadow-card">
            {/* Header: School Logo & Title */}
            <CardHeader
              title={
                <div className="flex items-center gap-3">
                  {school?.logo && (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-ink-200">
                      <Image
                        src={school.logo}
                        alt={`${school.fullName || "School"} logo`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-brand-600 block">
                      {school?.fullName || "School Portal"}
                    </span>
                    <h3 className="text-lg font-bold text-ink-900 mt-0.5">
                      {assignment.title}
                    </h3>
                  </div>
                </div>
              }
              action={
                <div className="flex flex-col items-end gap-1 text-xs text-ink-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <User size={13} className="text-ink-400" />
                    <span>Teacher: {assignment.teacherName}</span>
                  </div>
                </div>
              }
            />

            <CardBody className="space-y-5">
              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-600 bg-ink-50/70 p-3 rounded-xl border border-ink-100">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-ink-400" />
                  <span>
                    <strong className="font-semibold text-ink-800">Given Date:</strong>{" "}
                    {new Date(assignment.givenDate).toDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-rose-500" />
                  <span>
                    <strong className="font-semibold text-ink-800">Submission Due:</strong>{" "}
                    {new Date(assignment.submissionDate).toDateString()}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              {assignment.instructions && (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3.5 text-xs text-amber-900">
                  <span className="font-semibold text-amber-800 block mb-1">
                    Instructions:
                  </span>
                  <p className="leading-relaxed">{assignment.instructions}</p>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <HelpCircle size={14} className="text-brand-600" /> Questions
                </h4>
                <div className="space-y-2.5">
                  {assignment.questions?.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-ink-100 bg-white p-3 text-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                          {qIndex + 1}
                        </span>
                        <p className="text-ink-800 leading-snug">{question}</p>
                      </div>

                      {assignment.scores && assignment.scores[qIndex] && (
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Badge variant="subtle">
                            Max: {assignment.scores[qIndex]} marks
                          </Badge>

                          {assignment.studentScore &&
                            assignment.studentScore[qIndex] !== undefined &&
                            (assignment.studentScore[qIndex] > 0 || hasNonZeroScore) && (
                              <Badge variant="success">
                                Score: {assignment.studentScore[qIndex]} marks
                              </Badge>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Review Toggle Section (Student Portal view) */}
              {!teacherPage && !adminPage && assignment.studentSubmission?.length > 0 && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={review[assignment.id] ? Eye : EyeOff}
                    onClick={() =>
                      setReview((prevState) => ({
                        ...prevState,
                        [assignment.id]: !prevState[assignment.id],
                      }))
                    }
                  >
                    {review[assignment.id] ? "Hide Review" : "Show Review"}
                  </Button>

                  {review[assignment.id] && (
                    <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50/50 p-4 space-y-4">
                      <div className="flex items-center justify-between text-xs text-ink-500 border-b border-ink-200 pb-2">
                        <span className="font-semibold text-ink-700">Your Submitted Answers</span>
                        <span>Submitted On: {assignment.submittedDate}</span>
                      </div>

                      <div className="space-y-3">
                        {assignment.studentSubmission.map((answer, index) => (
                          <div key={index} className="text-xs space-y-1">
                            <span className="font-semibold text-ink-600">Answer {index + 1}:</span>
                            <p
                              className="text-ink-900 bg-white p-2.5 rounded-lg border border-ink-100 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: answer.replace(/\n/g, "<br />"),
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Image Gallery */}
                      {assignment.images && assignment.images.length > 0 && (
                        <div>
                          <p className="text-xs text-ink-400 mb-2">Click image to zoom in:</p>
                          <div className="flex flex-wrap gap-2">
                            {assignment.images.map((imageUrl, imgIndex) => (
                              <div
                                key={imgIndex}
                                onClick={() => openModal(imageUrl)}
                                className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-200 cursor-pointer hover:opacity-90"
                              >
                                <Image
                                  src={imageUrl}
                                  alt={`Assignment attachment ${imgIndex + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Role Action Buttons Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-ink-100">
                {/* Student Actions */}
                {!teacherPage && !adminPage && (
                  <>
                    {assignment.submissionStatus === "SUBMITTED" ? (
                      <Badge variant="success" className="py-1.5 px-3 text-xs">
                        {totalScore > 0
                          ? `Total Score: ${totalScore} marks`
                          : "Successfully Submitted"}
                      </Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={FileText}
                        onClick={() =>
                          handleAnswerAssignment(assignment.id, assignments)
                        }
                      >
                        Answer Task
                      </Button>
                    )}
                  </>
                )}

                {/* Admin Actions */}
                {adminPage && (
                  <Link href={`/admin/task/${teacherId}/${assignment.id}`}>
                    <Button variant="primary" size="sm" icon={ExternalLink}>
                      View Submissions
                    </Button>
                  </Link>
                )}

                {/* Teacher Actions */}
                {teacherPage && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Pencil}
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      Edit Task
                    </Button>

                    <Link href={`/task/${assignment.id}`}>
                      <Button variant="primary" size="sm" icon={ExternalLink}>
                        View Submissions
                      </Button>
                    </Link>

                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}

      {/* Fullscreen Zoom Modal */}
      {isModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative flex h-[85vh] w-[90vw] flex-col overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
            ref={containerRef}
          >
            <div className="relative flex-1 overflow-hidden">
              <Image
                src={selectedImage}
                alt="Enlarged Attachment Image"
                fill
                style={{
                  objectFit: "contain",
                  transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                  cursor: isDraggable ? "grab" : "default",
                }}
                draggable={false}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-black/90 px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={ZoomIn}
                  onClick={zoomIn}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Zoom In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ZoomOut}
                  onClick={zoomOut}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Zoom Out
                </Button>
              </div>

              <Button
                variant="danger"
                size="sm"
                icon={X}
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskComponent;
