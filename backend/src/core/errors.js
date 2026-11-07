/** An error that is safe to show to the client. Anything else becomes a generic 500. */
export class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message, code) => new AppError(400, message, code);
export const unauthorized = (message = "Please sign in again", code) =>
  new AppError(401, message, code);
export const forbidden = (message, code) => new AppError(403, message, code);
export const notFound = (message = "Not found") => new AppError(404, message);
export const conflict = (message, code) => new AppError(409, message, code);
export const serviceUnavailable = (message, code) =>
  new AppError(503, message, code);
export const badGateway = (message) => new AppError(502, message);
