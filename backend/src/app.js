import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { isDatabaseReady } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { createDashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { createLessonRoutes } from "./modules/lesson/lesson.routes.js";
import { createRoadmapRoutes } from "./modules/roadmap/roadmap.routes.js";

export const createApp = (env, container) => {
  const app = express();
  const { authenticate, limits } = container;

  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(compression());

  // In production and in dev the browser reaches the API through the frontend's
  // own origin, so this only matters if FRONTEND_URL is set for direct access.
  if (env.FRONTEND_URL) {
    app.use(cors({ origin: env.FRONTEND_URL.split(","), credentials: true }));
  }

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  if (env.NODE_ENV !== "test") {
    // ":url" is avoided because QR share tokens appear in request paths.
    app.use(morgan(":method :status :response-time ms"));
  }

  app.get("/api/health", (req, res) => {
    container.ai.warmUp();
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "starting" });
  });

  app.use("/api", (req, res, next) => {
    // Personal data must never be cached by the CDN in front of the API.
    res.set("Cache-Control", "no-store");
    next();
  }, limits.general);
  app.use(
    "/api/auth",
    createAuthRoutes({ controller: container.authController, authenticate, limits })
  );
  app.use(
    "/api/roadmap",
    createRoadmapRoutes({ roadmapService: container.roadmapService, authenticate, limits })
  );
  app.use(
    "/api/lesson",
    createLessonRoutes({ lessonService: container.lessonService, authenticate, limits })
  );
  app.use(
    "/api/dashboard",
    createDashboardRoutes({ dashboardService: container.dashboardService, authenticate })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
