import { validationResult } from "express-validator";
export function validate(chains) {
    return async (req, res, next) => {
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
//# sourceMappingURL=validate.js.map