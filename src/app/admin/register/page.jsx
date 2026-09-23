"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { UserPlus, User, Key, Lock, ShieldCheck } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useSonner } from "@/lib/useSonner";

const Register = () => {
  const { customSonner } = useSonner();
  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();

  const initialValues = {
    username: "",
    name: "",
    gender: "",
    password: "",
    confirmPassword: "",
    schoolId: session?.schoolId,
  };

  const [values, setValues] = useState(initialValues);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Prevent spaces in username and password fields
    if (
      name === "username" ||
      name === "password" ||
      name === "confirmPassword"
    ) {
      const noSpacesValue = value.replace(/\s/g, ""); // Remove any spaces
      setValues({
        ...values,
        [name]: noSpacesValue,
      });
    } else {
      setValues({
        ...values,
        [name]: value,
      });
    }
  };

  useEffect(() => {
    if (sessionStatus !== "authenticated" && sessionStatus !== "loading") {
      redirect("/");
    }
  }, [sessionStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const trimmedValues = {
      name: values.name.trim(),
      gender: values.gender.trim(),
      username: values.username.trim(),
      password: values.password.trim(),
      confirmPassword: values.confirmPassword.trim(),
      schoolId: session?.schoolId || values.schoolId,
    };

    // Ensure password and confirm password match
    if (trimmedValues.password !== trimmedValues.confirmPassword) {
      customSonner({ type: "error", text: "Passwords do not match" });
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post("/api/users/create", {
        name: trimmedValues.name,
        gender: trimmedValues.gender,
        username: trimmedValues.username,
        password: trimmedValues.password,
        schoolId: trimmedValues.schoolId,
      });
      customSonner({ type: "success", text: data.message });
      setValues(initialValues);
      setLoading(false);
    } catch (error) {
      console.error("Error occurred:", error);
      customSonner({ type: "error", text: "An error occurred while creating user." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PageHeader
        dark={false}
        title="Register Staff User"
        subtitle="Create a new teacher or administrative user account for your school."
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader
            title="User Account Details"
            subtitle="Enter user profile information and login credentials"
          />
          <CardBody className="space-y-4">
            <Field label="Full Name" required>
              <Input
                icon={User}
                type="text"
                placeholder="e.g. John Doe"
                name="name"
                required
                value={values.name}
                onChange={handleInputChange}
              />
            </Field>

            <Field label="Username" required hint="3-16 characters, alphanumeric, no spaces">
              <Input
                icon={ShieldCheck}
                pattern="^[A-Za-z0-9]{3,16}$"
                type="text"
                placeholder="Username"
                name="username"
                required
                value={values.username}
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

            <Field
              label="Password"
              required
              hint="8-20 characters, min 1 number & 1 letter, no spaces"
            >
              <Input
                icon={Key}
                type="password"
                pattern="^(?=.*[0-9])(?=.*[a-zA-Z])(?!.*\s).{8,20}$"
                placeholder="Password"
                name="password"
                required
                value={values.password}
                onChange={handleInputChange}
              />
            </Field>

            <Field label="Confirm Password" required hint="Re-enter password to confirm match">
              <Input
                icon={Lock}
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                required
                pattern={values.password ? `^${values.password}$` : undefined}
                value={values.confirmPassword}
                onChange={handleInputChange}
              />
            </Field>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                icon={UserPlus}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loading ? "Registering..." : "Register User"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
};

export default Register;
