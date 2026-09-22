"use client";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Spinner from "@/components/Spinner/Spinner";

export default function AssignmentSubmissions({ params }) {
  const { taskId } = params;
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState({});
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(20.0);
  const zoomIn = () => setZoomLevel((prev) => prev + 5.5);
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 5.5, 6.0));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false); // New state
  const startPosition = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
    setZoomLevel(20.5);
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
    // Calculate scaled dimensions
    const scaledWidth = containerWidth * zoomLevel;
    const scaledHeight = containerHeight * zoomLevel;
    // Enable dragging if the image dimensions exceed the viewport
    setIsDraggable(
      scaledWidth > window.innerWidth || scaledHeight > window.innerHeight
    );
  }, [zoomLevel]);

  const handleMouseDown = (e) => {
    if (!isDraggable) return; // Only start dragging if draggable
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
      const { data } = await axios.get(`/api/assignments/submit/${taskId}`);
      console.log(data);
      setSubmissions(data.submissions);
      setAssignment(data.assignment);

      // Initialize scoring with existing scores or default to 0 for each question
      const initialScores = data.submissions?.reduce((acc, submission) => {
        acc[submission.id] = submission.scores.length
          ? submission.scores
          : data.assignment.scores.map(() => 0);
        return acc;
      }, {});

      setScoring(initialScores);
      setLoading(false);
    };

    fetchSubmissions();
  }, [taskId]);

  if (loading) {
    return (
      <h1 className="waitH1">
        <Spinner /> Loading submissions...
      </h1>
    );
  }
  if (submissions.length < 1) {
    return <h1 className="waitH1">You have no submissions yet.</h1>;
  }
  console.log(submissions);
  return (
    <div className={styles.submission}>
      <h1>Assignment Submissions</h1>
      <ul>
        {submissions.map((submission) => (
          <li key={submission.id} className={styles.eachSubmission}>
            <h3>
              Student: {submission.student.surname.toLowerCase()}{" "}
              {submission.student.name.toLowerCase()}
            </h3>
            <h4>Submitted On: {submission.submittedDate} </h4>
            <h4>Answers:</h4>
            <ol>
              {submission.submission.map((answer, index) => (
                <li key={index}>
                  <strong>Answer to question {index + 1}:</strong>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: answer.replace(/\n/g, "<br />"),
                    }}
                  />
                </li>
              ))}
            </ol>
            <div className={styles.imageGallery}>
              {submission.images && submission.images.length > 0 && (
                <p>Click on image to zoom in</p>
              )}
              <div className={styles.imageContainer}>
                {submission.images && submission.images.length > 0
                  ? submission.images.map((imageUrl, imgIndex) => (
                      <div key={imgIndex} className={styles.imageWrapper}>
                        <Image
                          src={imageUrl}
                          alt={`Assignment image ${imgIndex + 1}`}
                          width={100}
                          height={100}
                          className={styles.assignmentImage}
                          onClick={() => openModal(imageUrl)}
                        />
                      </div>
                    ))
                  : ""}

                {isModalOpen && selectedImage && (
                  <div className={styles.modalOverlay} onClick={closeModal}>
                    <div
                      className={styles.modalContent}
                      onClick={(e) => e.stopPropagation()}
                      ref={containerRef}
                    >
                      <div className={styles.scrollableContainer}>
                        <Image
                          src={selectedImage}
                          alt="Selected Assignment Image"
                          fill
                          style={{
                            objectFit: "contain",
                            transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                            cursor: isDraggable ? "move" : "default",
                          }}
                          className={styles.zoomImage}
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
                      <div className={styles.zoomControls}>
                        <button onClick={zoomIn}>Zoom In</button>
                        <button onClick={zoomOut}>Zoom Out</button>
                        <button onClick={closeModal}>Close</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.actions}>
              <h4>Scores:</h4>
              {assignment.questions.map((question, index) => (
                <div key={index}>
                  <label>Question {index + 1} : </label>
                  {scoring[submission.id]?.[index] !== undefined ||
                  submission.scores[index] !== undefined ? (
                    <span className={styles.scoreDisplay}>
                      {scoring[submission.id]?.[index] ??
                        submission.scores[index]}
                    </span>
                  ) : (
                    <span className={styles.noScore}>
                      Teacher has not marked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
