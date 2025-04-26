import { ObjectId, Types } from "mongoose";
import { IUser } from "@/domain/entities/User";
import { PaginatedResponse, QueryParams } from "../types/types";

export interface IUserRepository {
    save(user: IUser): Promise<IUser>
    findByEmail(email: string): Promise<IUser | null>
    findById(id: string): Promise<IUser | null>
    findByUsername(username: string): Promise<IUser | null>
    deleteById(id: string): Promise<void>
    update(id: string, updateData: Partial<IUser>): Promise<IUser>
    findByRole(role: string): Promise<IUser[]>
    findByLinkedIn(linkedinId: string): Promise<IUser | null>
    findUsers(queryParams: QueryParams): Promise<PaginatedResponse<IUser>>
    getUserProfile(userId: string): Promise<IUser | null>
    getUserById(userId: string): Promise<any>
    countByRole(role: string): Promise<number>
    getMonthlyUserGrowth(startDate: Date): Promise<Array<{ year: number; month: number; role: string; count: number }>>
}