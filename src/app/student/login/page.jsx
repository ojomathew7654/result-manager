"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import AuthCard from "@/components/layout/AuthCard";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const StudentLogin = () => {
  const initialValues = {
    password: "",
    username: "",
  };

  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Check if student is already logged in
  useEffect(() => {
    const studentData = localStorage.getItem("studentData");
    if (studentData) {
      router.push("/student/dashboard");
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value.trim(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/student/login/${values.username}-${values.password}`
      );
      if (data.status === 404) {
        setError(data.message);
        setLoading(false);
        return;
      }
      // Save student data to localStorage and navigate to option page
      localStorage.setItem("studentData", JSON.stringify(data));
      router.push("/student/dashboard");
    } catch (err) {
      console.error(err);
      setError("An error occurred during login.");
    }
    setLoading(false);
  };

  return (
    <AuthCard eyebrow="Students" title="Check your result" subtitle="Sign in with the details your school gave you.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username" htmlFor="username" className="text-white" required>
          <Input
            id="username"
            name="username"
            icon={User}
            placeholder="e.g. bSabitu"
            pattern="^[A-Za-z0-9]{3,16}$"
            value={values.username}
            onChange={handleInputChange}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" className="text-white" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pr-10"
              value={values.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Loading..." : "Log in"}
        </Button>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </form>
    </AuthCard>
  );
};

export default StudentLogin;
