import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
export declare function errorHandler(err: Error | mongoose.Error, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map