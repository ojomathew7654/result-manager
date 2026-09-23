"use client";

import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ZoomIn, ZoomOut, X, Calendar, User, CheckCircle2, AlertCircle, FileText, Image as ImageIcon } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

export default function AssignmentSubmissions({ params }) {
  const { teacherId, taskId } = params;
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState({});
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState({});

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

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/assignments/submit/${taskId}`);
        setSubmissions(data.submissions || []);
        setAssignment(data.assignment || {});

        const initialScores = data.submissions?.reduce((acc, submission) => {
          acc[submission.id] = submission.scores?.length
            ? submission.scores
            : (data.assignment?.scores || []).map(() => 0);
          return acc;
        }, {});

        setScoring(initialScores || {});
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm font-medium text-ink-500">Loading student submissions...</p>
      </div>
    );
  }

  const backLink = teacherId ? `/admin/task/${teacherId}` : "/admin/task";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href={backLink}>
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Teacher Tasks
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Assignment Submissions"
        subtitle={`Viewing submissions for ${assignment?.title || "assignment"}`}
      />

      {submissions.length < 1 ? (
        <Card>
          <CardBody className="py-12 text-center text-ink-400">
            <FileText className="mx-auto mb-3 h-12 w-12 text-ink-300" />
            <h3 className="text-base font-semibold text-ink-800">No Submissions Yet</h3>
            <p className="mt-1 text-sm text-ink-500">
              No students have submitted answers for this assignment yet.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => {
            const studentFullName = `${submission.student?.surname || ""} ${submission.student?.name || ""}`;
            return (
              <Card key={submission.id}>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <User className="text-brand-600" size={18} />
                      <span className="capitalize">{studentFullName}</span>
                    </div>
                  }
                  subtitle={`Class: ${(submission.student?.level || "").toUpperCase()}`}
                  action={
                    <div className="flex items-center gap-1.5 text-xs text-ink-500 bg-ink-50 px-3 py-1.5 rounded-full border border-ink-100">
                      <Calendar size={14} />
                      <span>Submitted: {submission.submittedDate}</span>
                    </div>
                  }
                />
                <CardBody className="space-y-6">
                  {/* Answers Section */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      Student Answers
                    </h4>
                    <div className="space-y-3">
                      {submission.submission?.map((answer, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-ink-100 bg-ink-50/50 p-4"
                        >
                          <span className="text-xs font-medium text-brand-700">
                            Question {index + 1}
                          </span>
                          <p
                            className="mt-1.5 text-sm text-ink-800 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: answer.replace(/\n/g, "<br />"),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image Attachments Section */}
                  {submission.images && submission.images.length > 0 && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                        <ImageIcon size={14} /> Uploaded Images (Click to view & zoom)
                      </h4>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {submission.images.map((imageUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            onClick={() => openModal(imageUrl)}
                            className="group relative h-24 w-24 overflow-hidden rounded-xl border border-ink-200 bg-black/5 cursor-pointer hover:border-brand-500 transition-all hover:shadow-md"
                          >
                            <Image
                              src={imageUrl}
                              alt={`Submission image ${imgIndex + 1}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="text-white" size={20} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Scores Section */}
                  <div className="rounded-xl border border-ink-100 bg-white p-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      Question Scores Breakdown
                    </h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {assignment.questions?.map((question, index) => {
                        const scoreVal =
                          scoring[submission.id]?.[index] ??
                          submission.scores?.[index];
                        const isMarked = scoreVal !== undefined && scoreVal !== null;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-50/30 px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-ink-700">
                              Question {index + 1}:
                            </span>
                            {isMarked ? (
                              <Badge variant="success">
                                {scoreVal} pts
                              </Badge>
                            ) : (
                              <span className="text-xs text-ink-400 italic">
                                Not marked
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Zoom Modal */}
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
                alt="Enlarged Submission Image"
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

            {/* Modal Zoom Controls */}
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
}
