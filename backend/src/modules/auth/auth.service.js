import { badRequest, conflict, forbidden, unauthorized } from "../../core/errors.js";
import { hashPassword, verifyPassword } from "./password.js";
import { REFRESH_TTL_MS, generateRefreshToken, hashToken } from "./tokens.js";

const ROTATION_GRACE_MS = 30 * 1000;

export const toPublicUser = (user) => ({
  id: String(user._id),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  dob: user.dob,
  city: user.city,
  classStudying: user.classStudying,
  verified: user.verified,
  hasPassword: Boolean(user.password),
});

export const createAuthService = ({ User, Session, otp, tokens, google }) => {
  const openSession = async (user, meta) => {
    const refreshToken = generateRefreshToken();
    const session = await Session.create({
      user: user._id,
      refreshTokenHash: hashToken(refreshToken),
      ip: meta.ip,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return {
      user: toPublicUser(user),
      accessToken: tokens.signAccessToken(user._id, session._id),
      refreshToken,
    };
  };

  return {
    async register(input) {
      const { email, phone, password, ...profile } = input;
      const existing = await User.findOne({ email });

      if (existing?.verified) {
        throw conflict("An account with this email already exists. Please sign in.");
      }

      const phoneOwner = await User.findOne({ phone, email: { $ne: email } });
      if (phoneOwner) {
        throw conflict("This phone number is already in use.");
      }

      // An unverified account can be overwritten, so a failed or lost code
      // never locks someone out of signing up with their own email address.
      const fields = { ...profile, phone, password: await hashPassword(password) };
      const user = existing
        ? await Object.assign(existing, fields).save()
        : await User.create({ ...fields, email });

      await otp.issue(user, "verify");
      return { email };
    },

    async login({ email, password }, meta) {
      const user = await User.findOne({ email }).select("+password");

      if (user && !user.password) {
        throw badRequest(
          "This account uses Google. Please continue with Google.",
          "USE_GOOGLE"
        );
      }

      const result = user
        ? await verifyPassword(password, user.password)
        : { valid: false };

      if (!result.valid) {
        throw unauthorized("Incorrect email or password.", "INVALID_CREDENTIALS");
      }

      if (result.needsRehash) {
        user.password = await hashPassword(password);
        await user.save();
      }

      if (!user.verified) {
        await otp.issue(user, "verify");
        throw forbidden(
          "Please verify your email. We just sent you a new code.",
          "EMAIL_NOT_VERIFIED"
        );
      }

      return openSession(user, meta);
    },

    async googleLogin({ credential }, meta) {
      const profile = await google.verify(credential);

      let user = await User.findOne({
        $or: [{ googleId: profile.googleId }, { email: profile.email }],
      }).select("+password");

      if (user) {
        user.googleId ??= profile.googleId;
        user.verified = true;
        await user.save();
      } else {
        user = await User.create({ ...profile, verified: true });
      }

      return openSession(user, meta);
    },

    async verifyEmail({ email, otp: code }, meta) {
      await otp.check(email, code, "verify");
      const user = await User.findOneAndUpdate(
        { email },
        { verified: true },
        { returnDocument: "after" }
      ).select("+password");
      if (!user) throw badRequest("That code is invalid or has expired.");
      await otp.clear(email, "verify");
      return openSession(user, meta);
    },

    /** Stays silent about whether the account exists. */
    async resendVerification({ email }) {
      const user = await User.findOne({ email });
      if (user && !user.verified) await otp.issue(user, "verify");
    },

    async forgotPassword({ email }) {
      const user = await User.findOne({ email });
      if (user) await otp.issue(user, "reset");
    },

    async checkResetCode({ email, otp: code }) {
      await otp.check(email, code, "reset");
    },

    async resetPassword({ email, otp: code, newPassword }) {
      await otp.check(email, code, "reset");
      const user = await User.findOneAndUpdate(
        { email },
        { password: await hashPassword(newPassword), verified: true }
      );
      if (!user) throw badRequest("That code is invalid or has expired.");
      await otp.clear(email, "reset");
      await Session.updateMany({ user: user._id }, { revoked: true });
    },

    async refresh(refreshToken) {
      if (!refreshToken) throw unauthorized("No active session", "NO_SESSION");

      const tokenHash = hashToken(refreshToken);
      const session = await Session.findOne({
        revoked: false,
        $or: [
          { refreshTokenHash: tokenHash },
          {
            previousTokenHash: tokenHash,
            rotatedAt: { $gt: new Date(Date.now() - ROTATION_GRACE_MS) },
          },
        ],
      });

      if (!session || (session.expiresAt && session.expiresAt < new Date())) {
        throw unauthorized("Your session has expired. Please sign in.", "NO_SESSION");
      }

      const user = await User.findById(session.user).select("+password");
      if (!user) throw unauthorized("Your session has expired. Please sign in.", "NO_SESSION");

      const result = {
        user: toPublicUser(user),
        accessToken: tokens.signAccessToken(user._id, session._id),
      };

      // A request using the previous token lost a race with another tab.
      // It gets an access token, and the winner's new cookie stays in place.
      if (session.refreshTokenHash !== tokenHash) return result;

      const nextToken = generateRefreshToken();
      session.previousTokenHash = tokenHash;
      session.refreshTokenHash = hashToken(nextToken);
      session.rotatedAt = new Date();
      session.expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
      await session.save();

      return { ...result, refreshToken: nextToken };
    },

    async logout(refreshToken) {
      if (!refreshToken) return;
      await Session.updateOne(
        { refreshTokenHash: hashToken(refreshToken) },
        { revoked: true }
      );
    },

    async logoutAll(userId) {
      await Session.updateMany({ user: userId }, { revoked: true });
    },
  };
};
