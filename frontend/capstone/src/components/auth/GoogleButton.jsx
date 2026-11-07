import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Google refuses raw IP origins, so the button would only show an error there. */
const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname);

const GoogleButton = ({ onSuccess, onError }) => {
  const { signIn } = useAuth();

  if (!CLIENT_ID) return null;

  if (isIpAddress) {
    return (
      <p className="rounded-lg border border-line p-3 text-center text-sm text-muted">
        Google sign-in does not work on an IP address. Open this site through localhost or its
        domain name.
      </p>
    );
  }

  const handleCredential = async ({ credential }) => {
    try {
      const session = await api("/auth/google", {
        method: "POST",
        body: { credential },
        auth: false,
      });
      signIn(session);
      onSuccess();
    } catch (error) {
      onError(error.message);
    }
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleCredential}
          onError={() => onError("Google sign-in was cancelled or failed.")}
          theme="filled_black"
          shape="pill"
          size="large"
          width="320"
          text="continue_with"
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export const OrDivider = () => (
  <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted">
    <span className="h-px flex-1 bg-line" />
    or
    <span className="h-px flex-1 bg-line" />
  </div>
);

export default GoogleButton;
