import { Types } from 'mongoose';

export interface DeveloperProfile {
  hourlyRate: number;
  experience: number;
  skills: string[];
  bio: string;
}

export interface UserInfo {
  _id: Types.ObjectId;
  username: string;
  email: string;
  profilePicture?: string;
  developerProfile?: DeveloperProfile;
}

export interface SessionDetails {
  _id: Types.ObjectId;
  title: string;
  description: string;
  sessionDate: Date;
  startTime: Date;
  duration: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'awaiting_payment';
  paymentStatus: "pending" | "completed";
  topics: string[];
  userId: UserInfo;
  developerId: UserInfo;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
}

export type SessionDocument = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  sessionDate: Date;
  startTime: Date;
  duration: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'awaiting_payment';
  paymentStatus: "pending" | "completed";
  topics: string[];
  userId: Types.ObjectId | UserInfo;
  developerId: Types.ObjectId | UserInfo;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
}