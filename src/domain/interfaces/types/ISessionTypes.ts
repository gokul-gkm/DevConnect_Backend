import { ISession } from "@/domain/entities/Session";

export interface SessionUser {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
}

export interface SessionRating {
  rating?: number;
  comment?: string;
}

export interface ISessionDetails extends ISession {
  user: SessionUser;
  rating?: SessionRating;
}