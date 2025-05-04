import { ISession } from "@/domain/entities/Session";
import { Types } from "mongoose";
import { SessionDetails } from "../types/session";

export interface ISessionRepository {
    createSession(sessionData: Partial<ISession>): Promise<ISession>
    getBookedSlots(developerId: string, date: Date): Promise<any>
    checkSlotAvailability(developerId: string, sessionDate: Date | string, startTime: Date | string, duration: number): Promise<boolean>
    getUserSessions(userId: string): Promise<ISession[]>
    getDeveloperSessions(developerId: string): Promise<ISession[]>
    getUpcomingSessions(userId: string, currentDate: Date): Promise<any>
    getSessionRequests(developerId: Types.ObjectId): Promise<any>
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
    getSessionHistory(userId: string, currentDate: Date):Promise<any>
}