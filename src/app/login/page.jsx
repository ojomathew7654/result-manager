"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import AuthCard from "@/components/layout/AuthCard";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const initialValues = {
    password: "",
    username: "",
  };
  const [values, setValues] = useState(initialValues);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value.trim(),
    });
  };

  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      const role = session.role;
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else if (role === "ACCOUNTANT") {
        router.push("/payment");
      } else {
        router.push("/attendance");
      }
    }
  }, [router, sessionStatus, session]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.username,
        password: values.password,
      });

      if (res?.error) {
        setError("Wrong credentials");
      }
    } catch (err) {
      console.log(err);
      setError("An error occurred during login");
    }
    setLoading(false);
  };

  return (
    <AuthCard eyebrow="Staff & admin" title="Welcome back" subtitle="Sign in to manage results, classes and students.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username" htmlFor="username" required>
          <Input
            id="username"
            name="username"
            icon={User}
            placeholder="e.g. admin"
            pattern="^[A-Za-z0-9]{3,16}$"
            value={values.username}
            onChange={handleInputChange}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
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

export default Login;
