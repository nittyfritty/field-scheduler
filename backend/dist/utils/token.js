import jwt from "jsonwebtoken";
const JWT_EXPIRES_IN = "30m";
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is required");
    }
    return secret;
}
export function generateToken(user) {
    const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), {
        expiresIn: JWT_EXPIRES_IN,
    });
    const payload = jwt.decode(token);
    return {
        token,
        expiresAt: payload?.exp ?? 0,
    };
}
export function verifyToken(token) {
    return jwt.verify(token, getJwtSecret());
}
//# sourceMappingURL=token.js.map