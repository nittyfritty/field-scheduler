import { type Document, Types } from "mongoose";
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
    isApproved: boolean;
    division: string[];
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=User.d.ts.map