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
export declare function generateToken(user: ITokenUser): IGeneratedToken;
export declare function verifyToken(token: string): ITokenPayload;
//# sourceMappingURL=token.d.ts.map