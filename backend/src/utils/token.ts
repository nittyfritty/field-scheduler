import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "30m";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

export interface ITokenUser {
  id: string;
  role?: string;
}

export interface ITokenPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface IGeneratedToken {
  token: string;
  expiresAt: number;
}

export function generateToken(user: ITokenUser): IGeneratedToken {
  const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });

  const payload = jwt.decode(token) as ITokenPayload | null;

  return {
    token,
    expiresAt: payload?.exp ?? 0,
  };
}

export function verifyToken(token: string): ITokenPayload {
  return jwt.verify(token, getJwtSecret()) as ITokenPayload;
}