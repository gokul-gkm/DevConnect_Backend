import mongoose, { Schema, Document, ObjectId, Types } from "mongoose";

export interface IVideoSession extends Document {
    _id: ObjectId;
    sessionId: Types.ObjectId;
    roomId: string;          
    status: "pending" | "active" | "ended";
    startTime: Date;
    endTime?: Date;
    hostId: Types.ObjectId;
    participantId: Types.ObjectId;
    hostJoinedAt?: Date;
    participantJoinedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const VideoSessionSchema: Schema = new Schema({
    sessionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Session', 
        required: true 
    },
    roomId: { 
        type: String, 
        required: true,
        unique: true 
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'ended'],
        default: 'pending'
    },
    startTime: { 
        type: Date, 
        required: true 
    },
    endTime: { 
        type: Date 
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostJoinedAt: {
        type: Date
    },
    participantJoinedAt: {
        type: Date
    }
}, {
    timestamps: true
});

VideoSessionSchema.index({ sessionId: 1 });
VideoSessionSchema.index({ roomId: 1 }, { unique: true });
VideoSessionSchema.index({ status: 1 });

export const VideoSession = mongoose.model<IVideoSession>('VideoSession', VideoSessionSchema);
