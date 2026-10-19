import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import { Types } from "mongoose";
import app from "../app.js";
import { User } from "../models/User.js";

function makeUser(role: "admin" | "user") {
  return new User({
    _id: new Types.ObjectId(),
    name: role === "admin" ? "Admin User" : "Test User",
    email: `${role}@example.com`,
    password: "not-a-real-password",
    role,
    isApproved: role === "admin",
    division: [],
  });
}

function authorizationFor(user: ReturnType<typeof makeUser>) {
  return {
    Authorization: `Bearer ${jwt.sign(
      { id: user.id },
      "admin-route-test-secret",
    )}`,
  };
}

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "admin-route-test-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("admin API", () => {
  describe("GET /api/admin/pending-accounts", () => {
    it("rejects requests without a bearer token", async () => {
      const response = await request(app).get("/api/admin/pending-accounts");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized" });
    });

    it("forbids access to a non-admin user", async () => {
      const user = makeUser("user");
      vi.spyOn(User, "findById").mockResolvedValue(user);

      const response = await request(app)
        .get("/api/admin/pending-accounts")
        .set(authorizationFor(user));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Forbidden: admin access required",
      });
    });

    it("returns pending accounts to an admin", async () => {
      const admin = makeUser("admin");
      const pendingUser = makeUser("user");
      vi.spyOn(User, "findById").mockResolvedValue(admin);
      vi.spyOn(User, "find").mockResolvedValue([pendingUser]);

      const response = await request(app)
        .get("/api/admin/pending-accounts")
        .set(authorizationFor(admin));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        email: pendingUser.email,
        isApproved: false,
      });
    });

    it("returns 500 when pending accounts cannot be loaded", async () => {
      const admin = makeUser("admin");
      vi.spyOn(User, "findById").mockResolvedValue(admin);
      vi.spyOn(User, "find").mockRejectedValue(new Error("database unavailable"));

      const response = await request(app)
        .get("/api/admin/pending-accounts")
        .set(authorizationFor(admin));

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Error fetching pending accounts",
      });
    });
  });

  describe("POST /api/admin/approve-account/:userId", () => {
    it("returns 404 when the target account does not exist", async () => {
      const admin = makeUser("admin");
      vi.spyOn(User, "findById")
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .post(`/api/admin/approve-account/${new Types.ObjectId().toHexString()}`)
        .set(authorizationFor(admin));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "User not found" });
    });

    it("approves an account and records the approving admin", async () => {
      const admin = makeUser("admin");
      const pendingUser = makeUser("user");
      vi.spyOn(User, "findById")
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(pendingUser);
      vi.spyOn(User.prototype, "save").mockResolvedValue(pendingUser);

      const response = await request(app)
        .post(`/api/admin/approve-account/${pendingUser.id}`)
        .set(authorizationFor(admin));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: "User account approved",
        approvedBy: admin.id,
      });
      expect(response.body.approvedAt).toEqual(expect.any(String));
      expect(pendingUser.isApproved).toBe(true);
      expect(pendingUser.approvedBy?.toString()).toBe(admin.id);
      expect(pendingUser.approvedAt).toBeInstanceOf(Date);
    });
  });
});
