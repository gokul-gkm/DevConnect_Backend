import { ObjectId, Types } from "mongoose";
import { IUser } from "@/domain/entities/User";

export interface IUserRepository {
    save(user: IUser): Promise<IUser>
    findByEmail(email: string): Promise<IUser | null>
    findByUsername(username: string): Promise<IUser | null>
    deleteById(id: ObjectId): Promise<void>
}