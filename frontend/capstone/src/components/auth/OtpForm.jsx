import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { Button, Field, FormError } from "../ui";

/** Verifies a new account's email. A correct code signs the student straight in. */
const OtpForm = ({ email, onVerified, onBack }) => {
  const { signIn } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await api("/auth/verify-email", {
        method: "POST",
        body: { email, otp: code },
        auth: false,
      });
      signIn(session);
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api("/auth/resend-otp", { method: "POST", body: { email }, auth: false });
      toast.success("A new code is on its way.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-muted">
        We sent a 6-digit code to <span className="font-medium text-text">{email}</span>. It
        expires in 5 minutes.
      </p>
      <Field
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        autoFocus
        required
      />
      <FormError>{error}</FormError>
      <Button type="submit" className="w-full" loading={loading} disabled={code.length !== 6}>
        Verify and continue
      </Button>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={onBack} className="text-muted hover:text-text">
          Back
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-medium text-helix hover:underline disabled:opacity-50"
        >
          {resending ? "Sending..." : "Send a new code"}
        </button>
      </div>
    </form>
  );
};

export default OtpForm;
