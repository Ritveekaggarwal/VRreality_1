import { OAuth2Client } from "google-auth-library";
import { serviceUnavailable } from "../../core/errors.js";

/*
 * Every sender exposes send({ to, subject, text, html }) and throws on failure.
 * All of them use HTTPS: Render's free tier blocks outbound SMTP ports, so
 * SMTP-based sending would fail after deployment even with valid credentials.
 */

const TIMEOUT_MS = 15000;

const createBrevoSender = ({ apiKey, from, fromName }) => ({
  async send({ to, subject, text, html }) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { email: from, name: fromName },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Brevo responded ${response.status}: ${await response.text()}`);
    }
  },
});

const encodeHeader = (value) =>
  `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;

const createGmailSender = ({ clientId, clientSecret, refreshToken, user, fromName }) => {
  const client = new OAuth2Client(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });

  return {
    async send({ to, subject, html }) {
      const { token } = await client.getAccessToken();
      const message = [
        `From: ${encodeHeader(fromName)} <${user}>`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "",
        html,
      ].join("\r\n");

      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ raw: Buffer.from(message).toString("base64url") }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }
      );
      if (!response.ok) {
        throw new Error(`Gmail responded ${response.status}: ${await response.text()}`);
      }
    },
  };
};

/** Development only: prints the email so sign-up works without a mail provider. */
const createConsoleSender = () => ({
  async send({ to, subject, text }) {
    console.log(`\n--- EMAIL to ${to} ---\n${subject}\n${text}\n--- END EMAIL ---\n`);
  },
});

const createDisabledSender = () => ({
  async send() {
    throw serviceUnavailable(
      "Email sign-in is not set up yet. Please continue with Google.",
      "EMAIL_NOT_CONFIGURED"
    );
  },
});

export const createEmailSender = (env) => {
  switch (env.emailProvider) {
    case "brevo":
      return createBrevoSender({
        apiKey: env.BREVO_API_KEY,
        from: env.EMAIL_FROM,
        fromName: env.EMAIL_FROM_NAME,
      });
    case "gmail":
      return createGmailSender({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        refreshToken: env.GOOGLE_REFRESH_TOKEN,
        user: env.GOOGLE_USER,
        fromName: env.EMAIL_FROM_NAME,
      });
    case "console":
      return createConsoleSender();
    default:
      return createDisabledSender();
  }
};
