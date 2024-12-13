import { ObjectId, Types } from "mongoose";
import { IUser, User } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";

export class UserRepository implements IUserRepository{
    async save(user: IUser): Promise<IUser> {
        return await user.save()
    }

    async findByEmail(email: string): Promise<IUser | null>{
        return await User.findOne({ email })
    }
    async findByUsername(username: string): Promise<IUser | null>{
        return await User.findOne({username})
    }
    async deleteById(id: ObjectId): Promise<void> {
        await User.deleteOne({_id: id})
    }
    
}