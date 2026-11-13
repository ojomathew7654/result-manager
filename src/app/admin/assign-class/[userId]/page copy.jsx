"use client";
import React, { useEffect, useState } from "react";
import styles from "../assignClass.module.css";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner/Spinner";

const EditUser = ({ params }) => {
  const { userId } = params;
  const [user, setUser] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [schoolSubjects, setSchoolSubjects] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data } = await axios.get(`/api/users/${userId}`);
      setUser(data);
      setSelectedClasses(data.classes || []);
      setSelectedSubjects(data.subjects || []);
      setTeacherClasses(data.teacherOf || []);
    };
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        const sortedClasses = data.classes ? data.classes.sort() : [];
        const sortedSubjects = data.subjects ? data.subjects.sort() : [];
        setSchoolClasses(sortedClasses || []);
        setSchoolSubjects(sortedSubjects || []);
      } catch (error) {
        console.error("Error fetching school classes:", error);
      }
    };
    if (session?.schoolId) {
      fetchSchoolClasses();
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session.role !== "ADMIN") {
        signOut();
        router.push("/");
      }
    }
  }, [sessionStatus, session, router]);
  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") router.push("/");

  const addClass = async () => {
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/teacher/addclass/${userId}`, {
        classesToAdd: selectedClasses,
      });
      alert(data.message);
    } catch (err) {
      alert("Error Adding Class");
    }
    setLoading(false);
  };

  const addSubject = async () => {
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/teacher/addsubject/${userId}`, {
        subjectsToAdd: selectedSubjects,
      });
      alert(data.message);
    } catch (err) {
      alert("Error Adding Subject");
    }
    setLoading(false);
  };

  const addTeacherClasses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put(`/api/teacher/addclass/${userId}`, {
        classesToAdd: teacherClasses,
      });
      alert(data.message);
    } catch (err) {
      alert("Error Adding Classes");
    }
    setLoading(false);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubjects((prevSelectedSubjects) => {
      if (prevSelectedSubjects.includes(subject)) {
        return prevSelectedSubjects.filter((s) => s !== subject);
      } else {
        return [...prevSelectedSubjects, subject];
      }
    });
  };

  const handleClassChange = (classItem) => {
    setSelectedClasses((prevSelectedClasses) => {
      if (prevSelectedClasses.includes(classItem)) {
        return prevSelectedClasses.filter((s) => s !== classItem);
      } else {
        return [...prevSelectedClasses, classItem];
      }
    });
  };

  const handleTeacherClassChange = (classItem) => {
    setTeacherClasses((prevTeacherClasses) => {
      if (prevTeacherClasses.includes(classItem)) {
        return prevTeacherClasses.filter((c) => c !== classItem);
      } else {
        return [...prevTeacherClasses, classItem];
      }
    });
  };

  if (!user)
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );

  return (
    <div className={styles.container}>
      <h2>
        This is where you assign class and subject for a particular teacher
      </h2>
      <h4>
        {user?.name} can only update record of the class and subject assign to
        him/her to maintain student record safety.
      </h4>
      <div className={styles.singleUser}>
        <div className={styles.div1}>
          <h3>Select subject for this teacher</h3>
          {schoolSubjects.map((subject) => (
            <div className={styles.checkbox} key={`subject-${subject}`}>
              <input
                type="checkbox"
                id={`subject-${subject}`}
                value={subject}
                checked={selectedSubjects.includes(subject)}
                onChange={() => handleSubjectChange(subject)}
              />
              <label htmlFor={`subject-${subject}`}>{subject}</label>
            </div>
          ))}
          <div>
            <h3>Selected subjects for {user.username} will appear here.</h3>
            <ul>
              {selectedSubjects.map((subject) => (
                <li key={subject}>{subject}</li>
              ))}
            </ul>
            <div className={styles.btnContainer}>
              <button
                className={loading && styles.disabled}
                disabled={loading}
                onClick={addSubject}
              >
                {loading ? "Please wait..." : "Add Subject"}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.div2}>
          <h3>Select class for this teacher</h3>
          {schoolClasses.map((classItem) => (
            <div className={styles.checkbox} key={`class-${classItem}`}>
              <input
                type="checkbox"
                id={`class-${classItem}`}
                value={classItem}
                checked={selectedClasses.includes(classItem)}
                onChange={() => handleClassChange(classItem)}
              />
              <label htmlFor={`class-${classItem}`}>{classItem}</label>
            </div>
          ))}
          <div>
            <h3>Selected classes for {user.username} will appear here.</h3>
            <ul>
              {selectedClasses.map((classItem) => (
                <li key={classItem}>{classItem}</li>
              ))}
            </ul>
            <div className={styles.btnContainer}>
              <button
                className={loading && styles.disabled}
                disabled={loading}
                onClick={addClass}
              >
                {loading ? "Please wait..." : "Add Classes"}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.div3}>
          <h3>
            This teacher will be able to mark the attendance of the selected
            classes.
          </h3>
          {schoolClasses.map((classItem) => (
            <div className={styles.checkbox} key={`teacherclass-${classItem}`}>
              <input
                type="checkbox"
                id={`teacherclass-${classItem}`}
                value={classItem}
                checked={teacherClasses.includes(classItem)}
                onChange={() => handleTeacherClassChange(classItem)}
              />
              <label htmlFor={`teacherclass-${classItem}`}>{classItem}</label>
            </div>
          ))}
          <div>
            <h3>Selected classes for {user.username} will appear here.</h3>
            <ul>
              {teacherClasses.map((classItem) => (
                <li key={classItem}>{classItem}</li>
              ))}
            </ul>
            <div className={styles.btnContainer}>
              <button
                className={loading && styles.disabled}
                disabled={loading}
                onClick={addTeacherClasses}
              >
                {loading ? "Please wait..." : "Add Classes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
