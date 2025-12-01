import { IUser } from "@/domain/entities/User";
import { PaginatedResponse, QueryParams } from "../../types/types";
import { IBaseRepository } from "./IBaseRepository";

export interface IUserRepository extends IBaseRepository<IUser>  {
    save(user: IUser): Promise<IUser>
    findByEmail(email: string): Promise<IUser | null>
    findById(id: string): Promise<IUser | null>
    findByUsername(username: string): Promise<IUser | null>
    update(id: string, updateData: Partial<IUser>): Promise<IUser>
    findByRole(role: string): Promise<IUser[]>
    findUsers(queryParams: QueryParams): Promise<PaginatedResponse<IUser>>
    getUserProfile(userId: string): Promise<IUser | null>
    getUserById(userId: string): Promise<Partial<IUser>>
    countByRole(role: string): Promise<number>
    getMonthlyUserGrowth(startDate: Date): Promise<Array<{ year: number; month: number; role: string; count: number }>>
}