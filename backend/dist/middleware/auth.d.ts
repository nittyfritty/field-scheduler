import type { Request, Response, NextFunction } from "express";
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map