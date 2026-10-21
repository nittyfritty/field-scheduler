import { Document, Schema, Types, model } from "mongoose";
const calendarSchema = new Schema({
    date: { type: Date, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ["game", "practice", "Field Unavailable"] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    allDay: { type: Boolean, default: false },
    isApproved: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fieldId: { type: Schema.Types.ObjectId, ref: "Field", required: true }
});
const Calendar = model("Calendar", calendarSchema);
export default Calendar;
//# sourceMappingURL=Calendar.js.map