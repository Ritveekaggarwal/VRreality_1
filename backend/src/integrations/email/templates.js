const COPY = {
  verify: {
    subject: "Your VReality verification code",
    line: "Use this code to verify your email address.",
  },
  reset: {
    subject: "Your VReality password reset code",
    line: "Use this code to reset your password. If you did not ask for this, you can ignore this email.",
  },
};

export const otpEmail = (code, purpose) => {
  const { subject, line } = COPY[purpose];
  return {
    subject,
    text: `${line}\n\n${code}\n\nThis code expires in 5 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:440px;margin:0 auto;padding:32px;background:#06141b;border-radius:16px;color:#eaf6f3">
  <h2 style="margin:0 0 12px;color:#3ddbc3">VReality</h2>
  <p style="margin:0 0 24px;line-height:1.5">${line}</p>
  <p style="margin:0 0 24px;font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p>
  <p style="margin:0;font-size:13px;color:#8fb0ae">This code expires in 5 minutes.</p>
</div>`,
  };
};
