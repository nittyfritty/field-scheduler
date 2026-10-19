import { Schema, model, type Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

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

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  division: {
    type: [String],
    enum: ["AAA", "Majors", "AA", "A", "T-Ball"],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete (ret as { password?: string }).password;
    return ret;
  },
});

export const User = model<IUser>("User", UserSchema);