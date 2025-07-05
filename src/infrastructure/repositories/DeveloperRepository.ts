import Developer, { IDeveloper } from '@/domain/entities/Developer';
import { User } from '@/domain/entities/User';
import { AppError } from '@/domain/errors/AppError';
import { DevPaginatedResponse, DevQueryParams} from '@/domain/types/types';
import mongoose, { FilterQuery, SortOrder } from 'mongoose';

export interface ICreateDeveloperParams {
    expertise: string[];
    hourlyRate: number;
    education: {
        degree: string;
        institution: string;
        year: number;
    };
    languages: string[];
    workingExperience: {
        companyName: string;
        experience: number;
        jobTitle: string;
    };
    userId: string;
    resume?: string;
 
}

export class DeveloperRepository {

    async createDeveloper(data: ICreateDeveloperParams): Promise<IDeveloper> {
        try {
            const developer = new Developer({
                ...data,
                status: 'pending',
                rating: 0,
                totalSessions: 0,
                userId: new mongoose.Types.ObjectId(data.userId)
            });

            await developer.save();
            return developer;
        } catch (error) {
            console.error('Error creating developer:', error);
            throw new AppError('Failed to create developer profile', 500);
        }
    }

    async findByUserId(userId: string): Promise<IDeveloper | null> {
        try {
            return await Developer.findOne({ userId: new mongoose.Types.ObjectId(userId) });
        } catch (error) {
            console.error('Error finding developer:', error);
            throw new AppError('Failed to fetch developer profile', 500);
        }
    }

    async updateDeveloper(developerId: string, updateData: Partial<IDeveloper>): Promise<IDeveloper | null> {
        try {
            const developer = await Developer.findByIdAndUpdate(
                developerId,
                { $set: updateData },
                { new: true }
            );

            if (!developer) {
                throw new AppError('Developer not found', 404);
            }
            return developer;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error updating developer:', error);
            throw new AppError('Failed to update developer profile', 500);
        }
    }

    async updateDeveloperStatus(
        developerId: string, 
        status: 'pending' | 'approved' | 'rejected',
        rejectionReason?: string
    ): Promise<IDeveloper | null> {
        try {
        
            const updateData: any = { status };
            if (status === 'rejected' && rejectionReason) {
                updateData.rejectionReason = rejectionReason;
            }
            
            const developer = await Developer.findByIdAndUpdate(
                developerId,
                { $set: updateData },
                { new: true }
            ).populate({
                path: 'userId',
                select: 'username email', 
                model: 'User' 
            });
                

            if (!developer) {
                throw new AppError('Developer not found', 404);
            }

            return developer;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error updating developer status:', error);
            throw new AppError('Failed to update developer status', 500);
        }
    }

    

    

    async findDevelopers(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                sortBy = 'createdAt',
                sortOrder = 'desc',
                status
            } = queryParams;
         
            const userFilter: FilterQuery<any> = { role: 'developer' };         
            if (search) {
                userFilter.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    
                ];
            }     
            const users = await User.find(userFilter).select('_id');
            const userIds = users.map(user => user._id);     
            const developerFilter: FilterQuery<IDeveloper> = {
                userId: { $in: userIds }
            };

            if (status) {
                developerFilter.status = status;
            }

            if (search) {
                developerFilter.$or = [
                    { expertise: { $in: [new RegExp(search, 'i')] } },
                    { languages: { $in: [new RegExp(search, 'i')] } },
                    { 'workingExperience.companyName': { $regex: search, $options: 'i' } },
                    { 'workingExperience.jobTitle': { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;

            const sort: { [key: string]: SortOrder } = {
                [sortBy]: sortOrder === 'asc' ? 1 : -1
            };

            const [developers, total] = await Promise.all([
                Developer.find(developerFilter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'username email contact profilePicture isVerified status socialLinks')
                    .exec(),
                Developer.countDocuments(developerFilter)
            ]);

            return {
                data: developers,
                pagination: {
                    total,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    limit
                }
            };
        } catch (error) {
            console.error('Error in findDevelopers:', error);
            throw error;
        }
    }

    async findDeveloperDetails(developerId: string): Promise<IDeveloper | null> {
        try {
            const developer = await Developer.findById(developerId)
                .populate({
                    path: 'userId',
                    select: 'username email profilePicture status bio contact socialLinks'
                })
                .select('-__v');
                if (!developer) {
                    return null;
                }
            const user = await User.findById(developer.userId)
                .select('socialLinks');
    
            
            if (user && developer.userId) {
                (developer.userId as any).socialLinks = user.socialLinks;
            }
    
            return developer;
        } catch (error) {
            console.error('Error in findDeveloperDetails:', error);
            throw error;
        }
    }

    async findDeveloperWithDetails(developerId: string): Promise<IDeveloper | null> {
        try {
            const developer = await Developer.findById(developerId)
                .populate({
                    path: 'userId',
                    select: 'username email profilePicture status bio contact'
                });
                
                if (!developer) {
                    return null;
                }
            const user = await User.findById(developer.userId)
                .select('socialLinks');
    
            
            if (user && developer.userId) {
                (developer.userId as any).socialLinks = user.socialLinks;
            }
            
            return developer;
        } catch (error) {
            console.error('Error in findDeveloperWithDetails:', error);
            throw error;
        }
    }
}