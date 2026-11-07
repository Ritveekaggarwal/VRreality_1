import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import GoogleButton, { OrDivider } from "../components/auth/GoogleButton";
import OtpForm from "../components/auth/OtpForm";
import { Button, Field, FormError, PasswordField } from "../components/ui";
import { api } from "../lib/api";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  city: "",
  classStudying: "",
  password: "",
};

const today = new Date().toISOString().slice(0, 10);

const SignupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goOn = () => navigate("/plan", { replace: true });

  const bind = (name) => ({
    name,
    value: form[name],
    onChange: (event) => setForm({ ...form, [name]: event.target.value }),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/register", { method: "POST", body: form, auth: false });
      setVerifying(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthLayout title="Check your email">
        <OtpForm email={form.email} onVerified={goOn} onBack={() => setVerifying(false)} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes about a minute.">
      <GoogleButton onSuccess={goOn} onError={setError} />
      <OrDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" autoComplete="given-name" required {...bind("firstName")} />
          <Field label="Last name" autoComplete="family-name" {...bind("lastName")} />
        </div>
        <Field label="Email" type="email" autoComplete="email" required {...bind("email")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" type="tel" autoComplete="tel" required {...bind("phone")} />
          <Field label="Date of birth" type="date" max={today} required {...bind("dob")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City (optional)" autoComplete="address-level2" {...bind("city")} />
          <Field label="Class or grade (optional)" {...bind("classStudying")} />
        </div>
        <PasswordField
          hint="At least 8 characters, with a letter and a number."
          autoComplete="new-password"
          required
          {...bind("password")}
        />
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-helix hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignupPage;
