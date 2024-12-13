import mongoose, { Schema, Document } from "mongoose";

export interface IOTP extends Document{
    email: string;
    otp: string;
    createdAt: Date;
    expiresAt: Date;
    attempts: number;
}

const OTPSchema: Schema = new Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    attempts: {type: Number, default: 0}
})

OTPSchema.index({expiresAt: 1}, {expireAfterSeconds:0})

export const OTP = mongoose.model<IOTP>('OTP', OTPSchema);