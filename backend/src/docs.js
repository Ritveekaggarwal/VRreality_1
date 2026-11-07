import { readFileSync } from "node:fs";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";

const spec = parse(
  readFileSync(new URL("../docs/openapi.yaml", import.meta.url), "utf8")
);

/** Interactive API reference at /api/docs, and the raw spec at /api/docs/openapi.json. */
export const createDocsRoutes = () => {
  const router = Router();
  router.get("/openapi.json", (req, res) => res.json(spec));
  router.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "VReality API",
      swaggerOptions: { persistAuthorization: true, withCredentials: true },
    })
  );
  return router;
};
