import type { RequestHandler } from "express";
import { type ValidationChain } from "express-validator";
export declare function validate(chains: ValidationChain[]): RequestHandler;
export declare const validateRequest: typeof validate;
//# sourceMappingURL=validate.d.ts.map