/**
 * Composition root: the only place that decides which concrete implementation
 * each service receives. Tests pass overrides to swap external systems for fakes.
 */
import { createAiClient } from "./integrations/ai.client.js";
import { createEmailSender } from "./integrations/email/index.js";
import { createGoogleVerifier } from "./integrations/google.verifier.js";
import { createTavusClient } from "./integrations/tavus.client.js";
import { createAuthenticate } from "./middleware/auth.middleware.js";
import { createRateLimiters } from "./middleware/rateLimit.middleware.js";
import Lesson from "./models/lesson.model.js";
import Otp from "./models/otp.model.js";
import Roadmap from "./models/roadmap.model.js";
import Session from "./models/session.model.js";
import User from "./models/user.model.js";
import { createAuthController } from "./modules/auth/auth.controller.js";
import { createAuthService } from "./modules/auth/auth.service.js";
import { createOtpService } from "./modules/auth/otp.service.js";
import { createTokenService } from "./modules/auth/tokens.js";
import { createDashboardService } from "./modules/dashboard/dashboard.service.js";
import { createLessonService } from "./modules/lesson/lesson.service.js";
import { createShareTokens } from "./modules/lesson/share.tokens.js";
import { createRoadmapService } from "./modules/roadmap/roadmap.service.js";

export const createContainer = (env, overrides = {}) => {
  const ai =
    overrides.ai ??
    createAiClient({ baseUrl: env.AI_SERVER_URL, serviceToken: env.AI_SERVICE_TOKEN });
  const tavus =
    overrides.tavus ??
    createTavusClient({
      apiKey: env.TAVUS_API_KEY,
      personaId: env.TAVUS_PERSONA_ID,
      replicaId: env.TAVUS_REPLICA_ID,
    });
  const emailSender = overrides.emailSender ?? createEmailSender(env);
  const google =
    overrides.google ?? createGoogleVerifier({ clientId: env.GOOGLE_AUTH_CLIENT_ID });

  const tokens = createTokenService({ secret: env.JWT_SECRET });
  const shareTokens = createShareTokens({ secret: env.JWT_SECRET });
  const otp = createOtpService({ Otp, emailSender, secret: env.JWT_SECRET });
  const authService = createAuthService({ User, Session, otp, tokens, google });

  return {
    ai,
    authenticate: createAuthenticate({ tokens, User, Session }),
    authController: createAuthController({
      authService,
      isProduction: env.isProduction,
    }),
    roadmapService: createRoadmapService({ Roadmap, ai }),
    lessonService: createLessonService({ Lesson, Roadmap, ai, tavus, shareTokens }),
    dashboardService: createDashboardService({ User, Roadmap, Lesson }),
    limits: createRateLimiters({ disabled: env.NODE_ENV === "test" }),
  };
};
