import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { errorHandler } from "./errorHandler.js";

function invokeErrorHandler(error: Error) {
  const app = express();
  app.get("/", (req, res, next) => {
    errorHandler(error, req, res, next);
  });
  return request(app).get("/");
}

describe("errorHandler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a generic JSON error without exposing a stack trace", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await invokeErrorHandler(new Error("Request failed"));

    expect(response.status).toBe(500);
    expect(response.type).toBe("application/json");
    expect(response.body).toEqual({ message: "Request failed" });
    expect(response.text).not.toContain(" at ");
  });

  it("maps duplicate-key errors to 409", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error("duplicate key"), {
      name: "MongoServerError",
      code: 11000,
    });

    const response = await invokeErrorHandler(error);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: "Duplicate record" });
  });

  it("maps Mongoose cast errors to 400", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new mongoose.Error.CastError("ObjectId", "invalid", "fieldId");

    const response = await invokeErrorHandler(error);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Invalid value for fieldId" });
  });
});
