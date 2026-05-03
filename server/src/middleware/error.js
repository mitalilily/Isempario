export function notFound(req, _res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const isValidationError = error.name === "ZodError" || error.name === "ValidationError" || error.name === "CastError";
  const status = error.status || (isValidationError ? 400 : 500);
  const message = error.name === "ZodError"
    ? error.errors.map((issue) => issue.message).join(", ")
    : error.message || "Something went wrong";

  res.status(status).json({
    message
  });
}
