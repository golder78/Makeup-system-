export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }
  if (error?.code === "P2003") {
    return res
      .status(409)
      .json({ error: "Operation violates a related-record constraint." });
  }

  console.error("Unhandled API error:", error);
  return res.status(500).json({ error: "Internal server error." });
}
