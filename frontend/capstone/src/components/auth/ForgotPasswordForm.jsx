import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { Button, Field, FormError, PasswordField } from "../ui";

const ForgotPasswordForm = ({ initialEmail, onDone }) => {
  const toast = useToast();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (action) => {
    setError("");
    setLoading(true);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const post = (path, body) => api(path, { method: "POST", body, auth: false });

  const handleSubmit = (event) => {
    event.preventDefault();
    run(async () => {
      if (step === "email") {
        await post("/auth/forgot-password", { email });
        setStep("code");
      } else if (step === "code") {
        await post("/auth/verify-reset-otp", { email, otp: code });
        setStep("password");
      } else {
        await post("/auth/reset-password", { email, otp: code, newPassword });
        toast.success("Password updated. Please sign in.");
        onDone();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === "email" && (
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
      )}
      {step === "code" && (
        <Field
          label="Code from your email"
          hint={`If ${email} has an account, a 6-digit code is on its way.`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          required
          autoFocus
        />
      )}
      {step === "password" && (
        <PasswordField
          label="New password"
          hint="At least 8 characters, with a letter and a number."
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          autoFocus
        />
      )}
      <FormError>{error}</FormError>
      <Button type="submit" className="w-full" loading={loading}>
        {{ email: "Send code", code: "Verify code", password: "Update password" }[step]}
      </Button>
      <button type="button" onClick={onDone} className="w-full text-sm text-muted hover:text-text">
        Back to sign in
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
