"use client";
import { FormInput } from "@/components/form/FormInput";
import { useEffect, useState } from "react";
import styles from "./registerStudent.module.css";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import Spinner from "@/components/Spinner/Spinner";

const yearsArray = ["2026/2027"];

const RegisterStudents = () => {
  const [loading, setLoading] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const { data: session, status: sessionStatus } = useSession();

  const initialValues = {
    level: "",
    password: "",
    confirmPassword: "",
    name: "",
    username: "",
    surname: "",
    gender: "",
    schoolId: session?.schoolId,
    academicYear: "",
    age: "",
    registrationNo: "",
  };

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    const fetchSchoolClasses = async () => {
      try {
        const { data } = await axios.get(`/api/school/${session.schoolId}`);
        setSchoolClasses(data.classes.sort() || []);
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
        redirect("/");
      }
    }
  }, [sessionStatus, session]);

  if (sessionStatus === "loading")
    return (
      <h1 className="waitH1">
        <Spinner /> Please wait...
      </h1>
    );
  if (sessionStatus !== "authenticated") redirect("/");

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Prevent spaces in username and password
    if (name === "username" || name === "password") {
      const noSpaceValue = value.replace(/\s/g, ""); // Remove any space
      setValues({
        ...values,
        [name]: noSpaceValue,
      });
    } else {
      setValues({
        ...values,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Sanitize other fields by trimming spaces
    const sanitizedValues = {
      ...values,
      name: values.name.trim(),
      surname: values.surname.trim(),
      registrationNo: values.registrationNo.trim(),
    };

    try {
      const { data } = await axios.post("/api/student/create", sanitizedValues);
      console.log(data);
      alert(data.message);

      if (data.status === 409) {
        alert(data.message);
        return;
      }
      setLoading(false);
      setValues(initialValues);
    } catch (error) {
      console.error("Error occurred:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className="form-control" onSubmit={handleSubmit}>
        <h1 className={styles.h1}>Register Students</h1>
        <div className={styles.allInputContainer}>
          <div className={styles.inputContainer}>
            <FormInput
              label="Surname"
              type="text"
              placeholder="Surname"
              name="surname"
              required={true}
              value={values.surname}
              onChange={handleInputChange}
            />
            <FormInput
              label="Name"
              type="text"
              placeholder="Name"
              name="name"
              required={true}
              value={values.name}
              onChange={handleInputChange}
            />
            <div className={styles.selectContainer}>
              <label htmlFor="">AcademicYear</label>
              <select
                value={values.academicYear}
                onChange={handleInputChange}
                name="academicYear"
                id="academicYear"
                required
              >
                <option value="" disabled selected hidden>
                  Academic Year
                </option>
                {yearsArray.map((classItem) => (
                  <option key={classItem} value={classItem}>
                    {classItem}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <FormInput
              errMes="Age should be a numeric value."
              label="Age"
              type="number"
              placeholder="Age"
              name="age"
              pattern="^\d+$"
              value={values.age}
              onChange={handleInputChange}
            />
            <FormInput
              label="Registration number"
              type="text"
              placeholder="Registration Number"
              name="registrationNo"
              value={values.registrationNo}
              onChange={handleInputChange}
            />
            <div className={styles.selectContainer}>
              <label htmlFor="">Class</label>
              <select
                value={values.level}
                onChange={handleInputChange}
                name="level"
                id="level"
                required
              >
                <option value="" disabled selected hidden>
                  Class
                </option>
                {schoolClasses?.map((classItem) => (
                  <option key={classItem} value={classItem}>
                    {classItem.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <div className={styles.selectContainer}>
              <label htmlFor="">Gender</label>
              <select
                value={values.gender}
                onChange={handleInputChange}
                name="gender"
                id="gender"
                required
              >
                <option value="" disabled selected hidden>
                  Gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <FormInput
              errMes="Username should be 3-16 characters and must not include any special character or space!"
              label="Username"
              type="text"
              placeholder="Username"
              name="username"
              required={true}
              pattern="^[A-Za-z0-9]{3,16}$"
              value={values.username}
              onChange={handleInputChange}
            />
            <FormInput
              label="Password"
              errMes="Password should be 8-20 characters and include at least 1 number, 1 letter, and no spaces."
              type="password"
              placeholder="Password"
              name="password"
              required={true}
              pattern="^(?=.*[0-9])(?=.*[a-zA-Z])(?!.*\\s).{8,20}$"
              value={values.password}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className={styles.submitbtnContainer}>
          <button disabled={loading} className={loading ? styles.disabled : ""}>
            {loading ? "Adding..." : "Register"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStudents;
