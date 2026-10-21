import mongoose from "mongoose";
export function errorHandler(err, req, res, next) {
    console.error(err);
    const error = err;
    const isDuplicateKeyError = error?.name === "MongoServerError" && error?.code === 11000;
    const isCastError = error?.name === "CastError";
    const statusCode = isDuplicateKeyError
        ? 409
        : isCastError
            ? 400
            : error?.code || 500;
    const message = isDuplicateKeyError
        ? "Duplicate record"
        : isCastError
            ? `Invalid value for ${error?.path || "field"}`
            : error?.message || "Internal Server Error";
    res.status(statusCode).json({ message });
}
//# sourceMappingURL=errorHandler.js.map