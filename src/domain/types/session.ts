import { Types } from 'mongoose';
import { ISession } from '../entities/Session';

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
  rating?: number; 
  feedback?: string;
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

export interface IUserData {
  _id: Types.ObjectId;
  username: string;
  email: string;
  profilePicture?: string;
}

export interface IAdminSession {
  _id: Types.ObjectId;
  title: string;
  description: string;
  sessionDate: Date;
  startTime: Date;
  duration: number;
  price: number;
  status: ISession['status'];
  paymentStatus: ISession['paymentStatus'];
  user: IUserData;
  developer: IUserData;
}

export interface IPagination{
  currentPage: number;
  totalPages: number;
  totalItems: number
}

export interface ITopEarningDeveloper {
  id: Types.ObjectId;
  name: string;
  email: string;
  profilePicture?: string;
  sessions: number;
  averageRating: number;
  totalEarnings: number;
  ratings: number[];
}

export interface IUserInfo{
  _id: Types.ObjectId;
  username: string;
  profilePicture?: string;
}


export interface ISessionBase {
  _id: Types.ObjectId;
  title: string;
  description: string;
  duration: number;
  price: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "scheduled"
    | "completed"
    | "active"
    | "cancelled";
  paymentStatus: "pending" | "completed";
  paymentTransferStatus?: "pending" | "transferred";
  rejectionReason?: string;
  sessionDate: Date;
  startTime: Date;
  createdAt: Date;
  updatedAt: Date;
  topics: string[];
  developerId: Types.ObjectId | null;
  userId: Types.ObjectId | null;
}

export interface IUpcomingSession extends Omit<ISessionBase, "userId"> {
  userId: IUserInfo;
}

export interface ISessionMatchCondition {
  status?: { $in: string[] };
  sessionDate?: { $gte?: Date; $lt?: Date };
  $or?: Record<string, any>[];
  title?: { $regex: string; $options: string };
  description?: { $regex: string; $options: string };
}

export interface IDeveloperSessionMatch {
  developerId: Types.ObjectId;
  sessionDate?: { $lte?: Date; $gte?: Date };
  status?: { $in: string[] };
  $or?: {
    title?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
    'user.username'?: { $regex: string; $options: string };
  }[];
}


