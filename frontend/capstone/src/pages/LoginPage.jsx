import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import GoogleButton, { OrDivider } from "../components/auth/GoogleButton";
import OtpForm from "../components/auth/OtpForm";
import { Button, Field, FormError, PasswordField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const LoginPage = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const destination = location.state?.from ?? "/dashboard";
  const goOn = () => navigate(destination, { replace: true });

  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [user, destination, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      signIn(session);
      goOn();
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") setMode("verify");
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === "verify") {
    return (
      <AuthLayout title="Verify your email">
        <OtpForm email={email} onVerified={goOn} onBack={() => setMode("login")} />
      </AuthLayout>
    );
  }

  if (mode === "forgot") {
    return (
      <AuthLayout title="Reset your password">
        <ForgotPasswordForm initialEmail={email} onDone={() => setMode("login")} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Pick up your roadmap where you left off.">
      <GoogleButton onSuccess={goOn} onError={setError} />
      <OrDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordField
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div className="text-right">
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="text-sm font-medium text-helix hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link to="/signup" className="font-medium text-helix hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
