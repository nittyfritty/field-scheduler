import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

type IError = Error & {
  code?: number;
  kind?: string;
  value?: unknown;
  path?: string;
};

export function errorHandler(
  err: Error | mongoose.Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err);

  const error = err as IError;
  const isDuplicateKeyError =
    error?.name === "MongoServerError" && error?.code === 11000;
  const isCastError = error?.name === "CastError";

  const statusCode = isDuplicateKeyError
    ? 409
    : isCastError
      ? 400
      : error?.code || 500;

  const message = isDuplicateKeyError
    ? "Duplicate record"
    : isCastError
      ? `Invalid value for ${error?.path || "field"}`
      : error?.message || "Internal Server Error";

  res.status(statusCode).json({ message });
}