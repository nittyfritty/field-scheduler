import type { Request, Response, NextFunction, RequestHandler } from "express";
import { validationResult, type ValidationChain } from "express-validator";

export function validate(chains: ValidationChain[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map((chain) => chain.run(req)));
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    next();
  };
}

export const validateRequest = validate;