import { ObjectId, Types, FilterQuery, SortOrder } from "mongoose";
import { IUser, User } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { AppError } from "@/domain/errors/AppError";
import { PaginatedResponse, QueryParams } from "@/domain/types/types";

export class UserRepository implements IUserRepository{
    async save(user: IUser): Promise<IUser> {
        return await user.save()
    }

    async findByEmail(email: string): Promise<IUser | null>{
        return await User.findOne({ email })
    }
    async findById(id: string): Promise<IUser | null> {
        return await User.findById(id
    )}
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

    async findByRole(role: string): Promise<IUser[]> {
        return await User.find({role})
    }

    async findByLinkedIn(linkedinId: string):Promise<IUser | null>{
        return await User.findOne({ linkedinId });
    }

    async findUsers(queryParams: QueryParams): Promise<PaginatedResponse<IUser>> {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = queryParams

            const filter: FilterQuery<IUser> = { role: 'user' };

            if (search) {
                filter.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;

            const sort: { [key: string]: SortOrder } = {
                [sortBy]: sortOrder === 'asc' ? 1 : -1
            };
            const [users, total] = await Promise.all([
                User.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .select('-password')
                    .exec(),
                    User.countDocuments(filter)
            ])

            return {
                data: users as IUser[],
                pagination: {
                    total,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    limit
                }
            }

        } catch (error) {
            console.error('Error in findUsers: ', error);
            throw error;
        }
        
    }

    
}