import { ISession } from "@/domain/entities/Session";
import { Types } from "mongoose";
import { SessionDetails } from "../types/session";
import { IBaseRepository } from "./IBaseRepository";

export interface ISessionRepository extends IBaseRepository<ISession>{
    createSession(sessionData: Partial<ISession>): Promise<ISession>
    getBookedSlots(developerId: string, date: Date): Promise<any>
    checkSlotAvailability(developerId: string, sessionDate: Date | string, startTime: Date | string, duration: number): Promise<boolean>
    getUserSessions(userId: string): Promise<ISession[]>
    getDeveloperSessions(developerId: string): Promise<ISession[]>
    getUpcomingSessions(userId: string, currentDate: Date, page?: number, limit?: number): Promise<any>
    getSessionRequests(developerId: Types.ObjectId, page: number, limit: number ): Promise<any>
    getSessionById(sessionId: Types.ObjectId): Promise<any>
    deleteSession(sessionId: string): Promise<void>
    updateSessionStatus(sessionId: Types.ObjectId, status: string): Promise<any>
    rejectSession(sessionId: Types.ObjectId, rejectionReason: string): Promise<any>
    getSessionBySessionId(sessionId: Types.ObjectId): Promise<SessionDetails>;
    updatePaymentTransferStatus(sessionId: Types.ObjectId, status: string): Promise<void>
    updatePaymentStatus(sessionId: Types.ObjectId, status: string): Promise<void>
    countCompletedSessions(): Promise<number>
    getDeveloperScheduledSessions(developerId: Types.ObjectId, page: number, limit: number): Promise<any>
    getScheduledSessionById(sessionId: Types.ObjectId): Promise<any>
    getSessionHistory(userId: string, currentDate: Date, page?: number, limit?: number): Promise<any>
    getTopEarningDevelopers(page: number, limit: number): Promise<any>
    getAdminSessionsList(status: string[], page: number, limit: number, search: string): Promise<any>
    getDeveloperSessionHistory(
        developerId: string,
        currentDate: Date,
        page: number,
        limit: number,
        search: string
    ): Promise<any>
    getDeveloperSessionHistoryById(developerId: string, sessionId: string): Promise<any>;
    getDeveloperMonthlyStats(developerId: string, year: number): Promise<any>;
    getDeveloperUpcomingSessions(developerId: string, limit?: number): Promise<any>;
    getTopicBasedRevenue(page: number, limit: number): Promise<{
        topics: Array<{
          topic: string;
          totalRevenue: number;
          sessionCount: number;
          averageRating: number;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
        };
    }> 
    cancelSession(sessionId: string, reason: string): Promise<void>;
}