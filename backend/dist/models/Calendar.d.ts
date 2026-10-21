import { Document, Schema, Types } from "mongoose";
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
    fieldId: Schema.Types.ObjectId;
}
declare const Calendar: import("mongoose").Model<ICalendar, {}, {}, {}, Document<unknown, {}, ICalendar, {}, import("mongoose").DefaultSchemaOptions> & ICalendar & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICalendar & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export default Calendar;
//# sourceMappingURL=Calendar.d.ts.map