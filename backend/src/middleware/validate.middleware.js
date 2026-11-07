import { badRequest } from "../core/errors.js";

/**
 * Validates req.body and replaces it with the parsed result. Schemas only allow
 * expected fields and types, which also blocks NoSQL operator injection.
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    throw badRequest(result.error.issues[0].message, "VALIDATION_ERROR");
  }
  req.body = result.data;
  next();
};

export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw badRequest(result.error.issues[0].message, "VALIDATION_ERROR");
  }
  next();
};
