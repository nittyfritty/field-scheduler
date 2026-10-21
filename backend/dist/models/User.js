import { Schema, model, Types } from "mongoose";
import bcrypt from "bcryptjs";
const UserSchema = new Schema({
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
    if (!this.isModified("password"))
        return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
UserSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.password;
        return ret;
    },
});
export const User = model("User", UserSchema);
//# sourceMappingURL=User.js.map