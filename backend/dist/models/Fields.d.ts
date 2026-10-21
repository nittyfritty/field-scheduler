import { Document } from "mongoose";
export interface IField extends Document {
    name: string;
    location: string;
}
declare const Field: import("mongoose").Model<IField, {}, {}, {}, Document<unknown, {}, IField, {}, import("mongoose").DefaultSchemaOptions> & IField & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IField & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export default Field;
//# sourceMappingURL=Fields.d.ts.map