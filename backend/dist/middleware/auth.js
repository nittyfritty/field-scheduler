import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
export async function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1] ?? req.cookies?.token;
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401).json({ message: "Invalid or expired token" });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }
}
export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        res.status(403).json({ message: "Forbidden: admin access required" });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map