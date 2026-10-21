import { validate } from "../middleware/validate.js";
import { Router } from "express";
import Calendar from "../models/Calendar.js";
import { body, param } from "express-validator";
import { authenticate, requireAdmin } from "../middleware/auth.js";
const router = Router();
router.post("/:eventId/approval", authenticate, requireAdmin, validate([
    param("eventId").isMongoId().withMessage("Invalid event ID"),
    body("decision")
        .isIn(["approved", "rejected"])
        .withMessage("Decision must be approved or rejected"),
]), async (req, res) => {
    try {
        const event = await Calendar.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        const { decision } = req.body;
        event.isApproved = decision;
        await event.save();
        res.json({ message: `Event ${decision}` });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating event approval" });
    }
});
router.get("/", authenticate, async (req, res) => {
    try {
        const calendars = await Calendar.find();
        res.json(calendars);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post("/", authenticate, validate([
    body("date").isISO8601().toDate(),
    body("title").isString().notEmpty(),
    body("type").isString().notEmpty(),
    body("startTime").matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body("endTime").matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body("fieldId").isMongoId(),
]), async (req, res) => {
    const { date, title, type, startTime, endTime, fieldId } = req.body;
    const requestedBy = req.user?._id;
    if (!requestedBy) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const approval = req.user?.role === "admin"
            ? {
                isApproved: "approved",
                approvedBy: req.user._id,
                approvedAt: new Date(),
            }
            : {};
        const newCalendar = new Calendar({
            date,
            title,
            type,
            startTime,
            endTime,
            requestedBy,
            fieldId,
            ...approval,
        });
        const savedCalendar = await newCalendar.save();
        res.status(201).json(savedCalendar);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
export default router;
//# sourceMappingURL=calendar.js.map