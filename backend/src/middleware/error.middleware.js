import { AppError } from "../core/errors.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

// Express identifies error handlers by their four parameters.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    res.destroy();
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }

  if (error.type === "entity.too.large") {
    res.status(413).json({ message: "Request is too large" });
    return;
  }

  if (error.type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON" });
    return;
  }

  if (error.name === "CastError") {
    res.status(404).json({ message: "Not found" });
    return;
  }

  console.error(`${req.method} ${req.path} failed:`, error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
};
