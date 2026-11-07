import crypto from "node:crypto";
import { badRequest } from "../../core/errors.js";
import { otpEmail } from "../../integrations/email/templates.js";

const MAX_ATTEMPTS = 5;

export const createOtpService = ({ Otp, emailSender, secret }) => {
  const hash = (code) => crypto.createHmac("sha256", secret).update(code).digest("hex");

  const invalid = () => badRequest("That code is invalid or has expired.", "INVALID_OTP");

  return {
    async issue(user, purpose) {
      const code = String(crypto.randomInt(100000, 1000000));
      await Otp.deleteMany({ email: user.email, type: purpose });
      await Otp.create({ email: user.email, user: user._id, otpHash: hash(code), type: purpose });
      await emailSender.send({ to: user.email, ...otpEmail(code, purpose) });
    },

    /** Checks a code. A wrong guess counts against a limit of five attempts. */
    async check(email, code, purpose) {
      const otp = await Otp.findOne({ email, type: purpose }).sort({ createdAt: -1 });
      if (!otp) throw invalid();

      const matches = crypto.timingSafeEqual(
        Buffer.from(hash(code), "hex"),
        Buffer.from(otp.otpHash, "hex")
      );

      if (!matches) {
        otp.attempts += 1;
        if (otp.attempts >= MAX_ATTEMPTS) await otp.deleteOne();
        else await otp.save();
        throw invalid();
      }

      return otp;
    },

    clear: (email, purpose) => Otp.deleteMany({ email, type: purpose }),
  };
};
