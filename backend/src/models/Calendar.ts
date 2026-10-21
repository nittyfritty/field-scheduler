import { Document, Schema, Types, model } from "mongoose";

interface ICalendar extends Document {
  date: Date;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  requestedBy: Types.ObjectId;
  isApproved?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  fieldId: Schema.Types.ObjectId; // Reference to the Field model
}

const calendarSchema = new Schema<ICalendar>({
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

const Calendar = model<ICalendar>("Calendar", calendarSchema);

export default Calendar;