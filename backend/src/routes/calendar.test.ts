import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import { Types } from "mongoose";
import app from "../app.js";
import Calendar from "../models/Calendar.js";
import { User } from "../models/User.js";

const fieldId = new Types.ObjectId().toHexString();

const calendarInput = {
  date: "2026-06-15",
  title: "Practice",
  type: "practice",
  startTime: "09:00",
  endTime: "10:00",
  fieldId,
};

function makeUser(role: "admin" | "user" = "user") {
  return new User({
    _id: new Types.ObjectId(),
    name: "Test User",
    email: "test@example.com",
    password: "not-a-real-password",
    role,
    isApproved: true,
    division: [],
  });
}

function bearerToken(userId: string): string {
  return jwt.sign({ id: userId }, "calendar-test-secret");
}

function withAuth(user = makeUser()) {
  vi.spyOn(User, "findById").mockResolvedValue(user);
  return { Authorization: `Bearer ${bearerToken(user.id)}` };
}

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "calendar-test-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("calendar API", () => {
  describe("GET /api/calendar", () => {
    it("rejects requests without a bearer token", async () => {
      const response = await request(app).get("/api/calendar");

      expect(response.status).toBe(401);
      expect(response.type).toBe("application/json");
      expect(response.body).toEqual({ message: "Unauthorized" });
    });

    it("returns an empty list when no events exist", async () => {
      vi.spyOn(Calendar, "find").mockResolvedValue([]);

      const response = await request(app)
        .get("/api/calendar")
        .set(withAuth());

      expect(response.status).toBe(200);
      expect(response.type).toBe("application/json");
      expect(response.body).toEqual([]);
    });

    it("returns 500 when loading events fails", async () => {
      vi.spyOn(Calendar, "find").mockRejectedValue(new Error("database unavailable"));

      const response = await request(app)
        .get("/api/calendar")
        .set(withAuth());

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal Server Error" });
    });
  });

  describe("POST /api/calendar", () => {
    it("returns validation details for invalid event input", async () => {
      const response = await request(app)
        .post("/api/calendar")
        .set(withAuth())
        .send({ title: "", startTime: "25:00" });

      expect(response.status).toBe(400);
      expect(response.type).toBe("application/json");
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: expect.any(String) }),
        ]),
      );
    });

    it("creates an event and returns the saved document", async () => {
      const user = makeUser();
      vi.spyOn(Calendar.prototype, "save").mockImplementation(async function () {
        return this;
      });

      const response = await request(app)
        .post("/api/calendar")
        .set(withAuth(user))
        .send({
          ...calendarInput,
          requestedBy: new Types.ObjectId().toHexString(),
        });

      expect(response.status).toBe(201);
      expect(response.type).toBe("application/json");
      expect(response.body).toMatchObject({
        title: "Practice",
        type: "practice",
        startTime: "09:00",
        endTime: "10:00",
        requestedBy: user._id.toHexString(),
        isApproved: "pending",
      });
    });

    it("returns 500 when saving an event fails", async () => {
      vi.spyOn(Calendar.prototype, "save").mockRejectedValue(
        new Error("database unavailable"),
      );

      const response = await request(app)
        .post("/api/calendar")
        .set(withAuth())
        .send(calendarInput);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal Server Error" });
    });
  });

  describe("POST /api/calendar/:eventId/approval", () => {
    it("forbids approval by a non-admin user", async () => {
      const response = await request(app)
        .post(`/api/calendar/${new Types.ObjectId().toHexString()}/approval`)
        .set(withAuth(makeUser("user")))
        .send({ decision: "approved" });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Forbidden: admin access required",
      });
    });

    it("returns 404 when the event does not exist", async () => {
      vi.spyOn(Calendar, "findById").mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/calendar/${new Types.ObjectId().toHexString()}/approval`)
        .set(withAuth(makeUser("admin")))
        .send({ decision: "approved" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Event not found" });
    });

    it("updates the event approval for an admin", async () => {
      const event = new Calendar(calendarInput);
      vi.spyOn(Calendar, "findById").mockResolvedValue(event);
      vi.spyOn(Calendar.prototype, "save").mockResolvedValue(event);

      const response = await request(app)
        .post(`/api/calendar/${new Types.ObjectId().toHexString()}/approval`)
        .set(withAuth(makeUser("admin")))
        .send({ decision: "approved" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Event approved" });
      expect(event.isApproved).toBe("approved");
    });
  });
});
