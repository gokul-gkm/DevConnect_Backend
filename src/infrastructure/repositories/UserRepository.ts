import { ObjectId, Types, FilterQuery, SortOrder } from "mongoose";
import { IUser, User } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { AppError } from "@/domain/errors/AppError";
import { PaginatedResponse, QueryParams } from "@/domain/types/types";
import { StatusCodes } from "http-status-codes";

export class UserRepository implements IUserRepository{
    async save(user: IUser): Promise<IUser> {
        return await user.save()
    }

    async findByEmail(email: string): Promise<IUser | null>{
        try {
            return await User.findOne({ email })
        } catch (error) {
            console.error('Error fetching User by email:', error);
            throw new AppError('Failed to fetch user', StatusCodes.INTERNAL_SERVER_ERROR);
        }  
        
    }
    async findById(id: string): Promise<IUser | null> {
        try {
            return await User.findById(id)
        } catch (error) {
            console.error('Error fetching User by Id:', error);
            throw new AppError('Failed to fetch user', StatusCodes.INTERNAL_SERVER_ERROR);
        }    
    }
    async findByUsername(username: string): Promise<IUser | null>{
        try {
            return await User.findOne({username})
        } catch (error) {
            console.error('Error fetching User by username:', error);
            throw new AppError('Failed to fetch user', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }
    async deleteById(id: string): Promise<void> {  
        try {
            await User.deleteOne({_id: id})
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new AppError('Failed to remove user', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }

    async update(id: string, updateData: Partial<IUser>): Promise<IUser>{
        try {
            const objectId = new Types.ObjectId(id);
            const updatedUser = await User.findByIdAndUpdate(objectId, updateData, { new: true });
            if (!updatedUser) {
                throw new AppError('User not found', StatusCodes.NOT_FOUND)
            }
            return updatedUser;
        } catch (error) {
            console.error('Error updating User:', error);
            throw new AppError('Failed to update user', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }

    async findByRole(role: string): Promise<IUser[]> {
        try {
            return await User.find({role})
        } catch (error) {
            console.error('Error fetching user by role:', error);
            throw new AppError('Failed to fetch user', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }

    async findByLinkedIn(linkedinId: string): Promise<IUser | null>{
        try {
            return await User.findOne({ linkedinId });
        } catch (error) {
            console.error('Error fetching user by LinkedIn id :', error);
            throw new AppError('Failed to fetch user', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
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

    async getUserProfile(userId: string): Promise<IUser | null> {
        try {
            return await User.findById(userId).select('-password -verificationExpires');
        } catch (error) {
            console.error('Error in getUserProfile: ', error);
            throw error;
        }
    }

    async getUserById(userId: string):Promise<any> {
        try {
          const user = await User.findById(userId).select('email username profilePicture');
          
          if (!user) {
            throw new AppError('User not found', StatusCodes.NOT_FOUND);
          }
          return user;
        } catch (error) {
          if (error instanceof AppError) throw error;
          throw new AppError('Failed to fetch user', StatusCodes.INTERNAL_SERVER_ERROR);
        }
      }

    
}