import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import { Types } from "mongoose";
import app from "../app.js";
import { User } from "../models/User.js";

const registration = {
  name: "Test User",
  email: "test@example.com",
  password: "S3cure!2026",
  role: "user",
  division: ["AAA"],
};

function makeUser() {
  return new User({
    _id: new Types.ObjectId(),
    name: registration.name,
    email: registration.email,
    password: registration.password,
    role: "user",
    isApproved: true,
    division: ["AAA"],
  });
}

function withAuth(user = makeUser()) {
  vi.spyOn(User, "findById").mockResolvedValue(user);
  return {
    user,
    authorization: {
      Authorization: `Bearer ${jwt.sign(
        { id: user.id },
        "auth-route-test-secret",
      )}`,
    },
  };
}

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "auth-route-test-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("auth API", () => {
  describe("POST /api/auth/register", () => {
    it("returns validation details for invalid registration input", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...registration, email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.type).toBe("application/json");
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: "Invalid email" }),
        ]),
      );
    });

    it("rejects an email that is already registered", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(makeUser());

      const response = await request(app)
        .post("/api/auth/register")
        .send(registration);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "User already exists" });
    });

    it("creates a user and omits the password from the response", async () => {
      const user = makeUser();
      vi.spyOn(User, "findOne").mockResolvedValue(null);
      vi.spyOn(User.prototype, "save").mockResolvedValue(user);

      const response = await request(app)
        .post("/api/auth/register")
        .send(registration);

      expect(response.status).toBe(201);
      expect(response.type).toBe("application/json");
      expect(response.body.user).toMatchObject({
        name: registration.name,
        email: registration.email,
        role: registration.role,
      });
      expect(response.body.user).not.toHaveProperty("password");
    });
  });

  describe("POST /api/auth/login", () => {
    it("rejects invalid login input", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "invalid", password: "short" });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: "Invalid email" }),
        ]),
      );
    });

    it("returns 401 for invalid credentials", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: registration.email,
          password: registration.password,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Invalid credentials" });
    });

    it("sets an HttpOnly cookie and returns the user for valid credentials", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const user = makeUser();
      vi.spyOn(User, "findOne").mockResolvedValue(user);
      vi.spyOn(user, "comparePassword").mockResolvedValue(true);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: registration.email,
          password: registration.password,
        });

      expect(response.status).toBe(200);
      expect(response.type).toBe("application/json");
      expect(response.body.expires).toEqual(expect.any(Number));
      expect(response.body.user.email).toBe(registration.email);
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("token");
      expect(response.headers["set-cookie"]).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /^token=[^;]+; Max-Age=\d+; Path=\/; Expires=.+; HttpOnly; Secure; SameSite=Lax$/,
          ),
        ]),
      );
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the authentication cookie", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(204);
      expect(response.headers["set-cookie"]).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /^token=; Path=\/; Expires=.+; HttpOnly; SameSite=Lax$/,
          ),
        ]),
      );
    });
  });

  describe("GET /api/auth/me", () => {
    it("rejects requests without a bearer token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized" });
    });

    it("returns the authenticated user", async () => {
      const { user, authorization } = withAuth();

      const response = await request(app)
        .get("/api/auth/me")
        .set(authorization);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: user.name,
        email: user.email,
      });
      expect(response.body).not.toHaveProperty("password");
    });

    it("authenticates requests with the HttpOnly cookie", async () => {
      const user = makeUser();
      vi.spyOn(User, "findById").mockResolvedValue(user);
      const token = jwt.sign(
        { id: user.id },
        "auth-route-test-secret",
        { expiresIn: "30m" },
      );

      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: user.name,
        email: user.email,
      });
    });

    it("returns 404 when the authenticated user no longer exists", async () => {
      const user = makeUser();
      vi.spyOn(User, "findById")
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .get("/api/auth/me")
        .set({
          Authorization: `Bearer ${jwt.sign(
            { id: user.id },
            "auth-route-test-secret",
          )}`,
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "User not found" });
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("returns validation errors for an unacceptable new password", async () => {
      const { authorization } = withAuth();

      const response = await request(app)
        .post("/api/auth/change-password")
        .set(authorization)
        .send({
          currentPassword: "old-password",
          newPassword: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: "Password must not contain the word 'password'",
          }),
        ]),
      );
    });

    it("changes the password when the current password is correct", async () => {
      const { user, authorization } = withAuth();
      vi.spyOn(user, "comparePassword")
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      vi.spyOn(User.prototype, "save").mockResolvedValue(user);

      const response = await request(app)
        .post("/api/auth/change-password")
        .set(authorization)
        .send({
          currentPassword: "old-password",
          newPassword: "NewSecure!2026",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Password changed successfully",
      });
      expect(user.password).toBe("NewSecure!2026");
    });
  });
});
