"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import { UserPlus, User, GraduationCap, Key, Hash, Calendar, Layers } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner/Spinner";

const yearsArray = ["2025/2026"];

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
        setSchoolClasses(data.classes?.sort() || []);
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

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm font-medium text-ink-500">Please wait...</p>
      </div>
    );
  }

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
      schoolId: session?.schoolId || values.schoolId,
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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Register Student"
        subtitle="Add a new student profile and set up credentials for portal access."
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader
            title="Student Profile Details"
            subtitle="Fill in personal details, class assignment, and account login info"
          />
          <CardBody className="space-y-6">
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                <User size={14} className="text-brand-600" /> Personal Details
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Surname" required>
                  <Input
                    type="text"
                    placeholder="Surname"
                    name="surname"
                    required
                    value={values.surname}
                    onChange={handleInputChange}
                  />
                </Field>

                <Field label="First Name" required>
                  <Input
                    type="text"
                    placeholder="First Name"
                    name="name"
                    required
                    value={values.name}
                    onChange={handleInputChange}
                  />
                </Field>

                <Field label="Gender" required>
                  <Select
                    value={values.gender}
                    onChange={handleInputChange}
                    name="gender"
                    id="gender"
                    required
                  >
                    <option value="" disabled hidden>
                      Select gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </Field>

                <Field label="Age" hint="Age should be a numeric value">
                  <Input
                    type="number"
                    placeholder="Age"
                    name="age"
                    pattern="^\d+$"
                    value={values.age}
                    onChange={handleInputChange}
                  />
                </Field>
              </div>
            </div>

            <hr className="border-ink-100" />

            {/* Section 2: Academic Assignment */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                <GraduationCap size={14} className="text-brand-600" /> Academic Placement
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Academic Year" required>
                  <Select
                    value={values.academicYear}
                    onChange={handleInputChange}
                    name="academicYear"
                    id="academicYear"
                    required
                  >
                    <option value="" disabled hidden>
                      Select academic year
                    </option>
                    {yearsArray.map((yearItem) => (
                      <option key={yearItem} value={yearItem}>
                        {yearItem}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Class" required>
                  <Select
                    value={values.level}
                    onChange={handleInputChange}
                    name="level"
                    id="level"
                    required
                  >
                    <option value="" disabled hidden>
                      Select class
                    </option>
                    {schoolClasses?.map((classItem) => (
                      <option key={classItem} value={classItem}>
                        {classItem.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Registration Number">
                  <Input
                    type="text"
                    placeholder="e.g. REG-2025-001"
                    name="registrationNo"
                    value={values.registrationNo}
                    onChange={handleInputChange}
                  />
                </Field>
              </div>
            </div>

            <hr className="border-ink-100" />

            {/* Section 3: Account Credentials */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                <Key size={14} className="text-brand-600" /> Portal Credentials
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Username"
                  required
                  hint="3-16 characters, letters & numbers only"
                >
                  <Input
                    type="text"
                    placeholder="Username"
                    name="username"
                    required
                    pattern="^[A-Za-z0-9]{3,16}$"
                    value={values.username}
                    onChange={handleInputChange}
                  />
                </Field>

                <Field
                  label="Password"
                  required
                  hint="8-20 characters, min 1 letter & 1 number"
                >
                  <Input
                    type="password"
                    placeholder="Password"
                    name="password"
                    required
                    pattern="^(?=.*[0-9])(?=.*[a-zA-Z])(?!.*\\s).{8,20}$"
                    value={values.password}
                    onChange={handleInputChange}
                  />
                </Field>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                icon={UserPlus}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loading ? "Adding Student..." : "Register Student"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
};

export default RegisterStudents;
