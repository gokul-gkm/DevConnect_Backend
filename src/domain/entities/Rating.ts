import { Schema, model, Document, ObjectId } from "mongoose";

export interface IRating extends Document {
  userId: ObjectId;
  sessionId: ObjectId;
  developerId: ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    developerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Rating = model<IRating>("Rating", ratingSchema);
