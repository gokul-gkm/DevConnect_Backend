import { IPagination } from "@/domain/types/session";
import { ObjectId } from "mongoose";

export interface IUserInfo {
  _id: ObjectId;
  username: string;
  profilePicture?: string;
}

export interface ISessionInfo {
  _id: ObjectId;
  title: string;
  sessionDate: Date;
  startTime: string;
}

export interface IReview {
  _id: ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  userId: IUserInfo;
  sessionId: ISessionInfo;
}

export interface IReviewResult {
  reviews: IReview[];
  pagination: IPagination;
}
