import { ObjectId, Types } from "mongoose";
import { IUser, User } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { AppError } from "@/domain/errors/AppError";

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
    async deleteById(id: string): Promise<void> {
        await User.deleteOne({_id: id})
    }

    async update(id: string, updateData: Partial <IUser>): Promise<IUser>{
        const objectId = new Types.ObjectId(id);
        const updatedUser = await User.findByIdAndUpdate(objectId, updateData, { new: true });
        if (!updatedUser) {
            throw new AppError('User not found', 404)
        }
        return updatedUser;
    }
    
}