import { OAuth2Client } from "google-auth-library";
import { serviceUnavailable, unauthorized } from "../core/errors.js";

export const createGoogleVerifier = ({ clientId }) => {
  const client = new OAuth2Client(clientId);

  return {
    /** Returns the verified Google profile, or throws. */
    async verify(credential) {
      if (!clientId) {
        throw serviceUnavailable("Google sign-in is not set up on the server.");
      }

      let payload;
      try {
        const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
        payload = ticket.getPayload();
      } catch (error) {
        console.error("Google token rejected:", error.message);
        throw unauthorized("Google sign-in failed. Please try again.");
      }

      if (!payload?.email || !payload.email_verified) {
        throw unauthorized("Your Google email address is not verified.");
      }

      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        firstName: payload.given_name || payload.name || "Student",
        lastName: payload.family_name || "",
      };
    },
  };
};
