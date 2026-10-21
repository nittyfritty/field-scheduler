import { Router } from "express";
import { body } from "express-validator";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { generateToken } from "../utils/token.js";
const router = Router();
const AUTH_COOKIE_NAME = "token";
function authCookieOptions(maxAge) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        ...(maxAge === undefined ? {} : { maxAge }),
    };
}
router.post("/register", validate([
    body("name").isString().withMessage("Name must be a string"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .bail()
        .custom((password, { req }) => {
        const normalizedPassword = password.toLowerCase();
        const name = typeof req.body.name === "string" ? req.body.name.toLowerCase() : "";
        const nameParts = name
            .trim()
            .split(/\s+/)
            .filter((part) => part.length >= 3);
        if (normalizedPassword.includes("password")) {
            throw new Error("Password must not contain the word 'password'");
        }
        if (nameParts.some((part) => normalizedPassword.includes(part))) {
            throw new Error("Password must not contain parts of your name");
        }
        return true;
    }),
    body("role").isIn(["admin", "user"]).withMessage("Invalid role"),
    body("division")
        .optional()
        .isArray()
        .withMessage("Division must be an array"),
    body("division.*")
        .isIn(["AAA", "Majors", "AA", "A", "T-Ball"])
        .withMessage("Invalid division"),
]), async (req, res) => {
    const { name, email, password, role, division } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }
    const user = new User({ name, email, password, role, division });
    await user.save();
    res.status(201).json({ user });
});
router.post("/login", validate([
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
]), async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const generatedToken = generateToken(user);
    const maxAge = Math.max(0, generatedToken.expiresAt * 1000 - Date.now());
    res.cookie(AUTH_COOKIE_NAME, generatedToken.token, authCookieOptions(maxAge));
    res.json({
        expires: generatedToken.expiresAt,
        user,
    });
});
router.post("/logout", (_req, res) => {
    res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
    res.status(204).end();
});
router.get("/me", authenticate, async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
});
router.get("/users", authenticate, async (req, res) => {
    const users = await User.find().sort({ createdAt: 1 });
    res.status(200).json(users);
});
router.post("/change-password", authenticate, validate([
    body("currentPassword").isString().notEmpty(),
    body("newPassword")
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .bail()
        .custom((password, { req }) => {
        const normalizedPassword = password.toLowerCase();
        const name = typeof req.body.name === "string" ? req.body.name.toLowerCase() : "";
        const nameParts = name
            .trim()
            .split(/\s+/)
            .filter((part) => part.length >= 3);
        if (normalizedPassword.includes("password")) {
            throw new Error("Password must not contain the word 'password'");
        }
        if (nameParts.some((part) => normalizedPassword.includes(part))) {
            throw new Error("Password must not contain parts of your name");
        }
        return true;
    }),
]), async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        if (await user.comparePassword(newPassword)) {
            return res.status(400).json({
                message: "New password must be different from the current password",
            });
        }
        user.password = newPassword;
        await user.save();
        return res.json({ message: "Password changed successfully" });
    }
    catch {
        return res.status(500).json({ message: "Error changing password" });
    }
});
export default router;
//# sourceMappingURL=auth.js.map