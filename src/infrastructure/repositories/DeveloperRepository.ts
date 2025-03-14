import { CreateDeveloperDTO } from '@/application/dto/developer/CreateDeveloperDTO';
import { DeveloperSearchDTO, DeveloperSearchResponse, ValidatedSearchParams } from '@/application/dto/users/DeveloperSearchDTO';
import Developer, { IDeveloper } from '@/domain/entities/Developer';
import { User } from '@/domain/entities/User';
import { AppError } from '@/domain/errors/AppError';
import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { DevPaginatedResponse, DevQueryParams} from '@/domain/types/types';
import { StatusCodes } from 'http-status-codes';
import mongoose, { FilterQuery, SortOrder } from 'mongoose';


export class DeveloperRepository implements IDeveloperRepository {

    async createDeveloper(data: CreateDeveloperDTO): Promise<IDeveloper> {
        try {
            const parsedYear = data.education && data.education.year 
            ? Number(data.education.year) 
            : undefined;
            const developer = new Developer({
                ...data,
                education: {
                    degree: data.education?.degree,
                    institution: data.education?.institution,
                    year: parsedYear
                },
                status: 'pending',
                rating: 0,
                totalSessions: 0,
                userId: new mongoose.Types.ObjectId(data.userId)
            });

            await developer.save();
            return developer;
        } catch (error) {
            console.error('Error creating developer:', error);
            throw new AppError('Failed to create developer profile', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async findByUserId(userId: string): Promise<IDeveloper | null> {
        try {
            return await Developer.findOne({ userId: new mongoose.Types.ObjectId(userId) });
        } catch (error) {
            console.error('Error finding developer:', error);
            throw new AppError('Failed to fetch developer profile', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async findById(id: string): Promise<IDeveloper | null>{
        try {
            return await Developer.findById(id);
        } catch (error) {
            console.error('Error finding developer:', error);
            throw new AppError('Failed to fetch developer profile', StatusCodes.INTERNAL_SERVER_ERROR);
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
                throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
            }
            return developer;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error updating developer:', error);
            throw new AppError('Failed to update developer profile', StatusCodes.INTERNAL_SERVER_ERROR);
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
                throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
            }

            return developer;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Error updating developer status:', error);
            throw new AppError('Failed to update developer status', StatusCodes.INTERNAL_SERVER_ERROR);
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
                    .populate('userId', 'username email profilePicture isVerified status socialLinks')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
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

    async update(userId: string, updateData: Partial<IDeveloper>): Promise<IDeveloper | null> {
        try {
            const updatedDeveloper = await Developer.findOneAndUpdate(
                { userId }, 
                { 
                    $set: {
                        hourlyRate: updateData.hourlyRate,
                        education: {
                            degree: updateData.education?.degree,
                            institution: updateData.education?.institution,
                            year: updateData.education?.year
                        },
                        languages: updateData.languages,
                        workingExperience: {
                            jobTitle: updateData.workingExperience?.jobTitle,
                            companyName: updateData.workingExperience?.companyName,
                            experience: updateData.workingExperience?.experience
                        },
                        expertise: updateData.expertise,
                        resume: updateData.resume
                    }
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if (!updatedDeveloper) {
                throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
            }

            return updatedDeveloper;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                'Error updating developer profile',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addProjectToPortfolio(developerId: string, projectId: string): Promise<void> {
        try {
            await Developer.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(developerId) },
                { $addToSet: { portfolio: projectId } },
                { new: true }
            );
        } catch (error) {
            console.error('Error adding project to portfolio:', error);
            throw new AppError('Failed to update developer portfolio', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async removeProjectFromPortfolio(developerId: string, projectId: string): Promise<void> {
        try {
            const result = await Developer.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(developerId) },
                { $pull: { portfolio: projectId } },
                { new: true }
            );

            if (!result) {
                throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
            }
        } catch (error) {
            console.error('Error removing project from portfolio:', error);
            throw new AppError('Failed to remove project from portfolio', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async searchDevelopers(params: ValidatedSearchParams): Promise<DeveloperSearchResponse> {
        const {
            search = '',
            skills = [],
            languages = [],
            priceRange,
            location = '',
            sort = 'newest',
            page,
            limit
        } = params;
    
        try {
            const aggregationPipeline: any[] = [
                {
                    $match: {
                        status: 'active',
                        role: 'developer',
                        isVerified: true
                    }
                },
                {
                    $lookup: {
                        from: 'developers',
                        let: { userId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$userId', '$$userId'] },
                                    status: 'approved'
                                }
                            }
                        ],
                        as: 'developerProfile'
                    }
                },
                {
                    $match: {
                        'developerProfile.0': { $exists: true }
                    }
                },
                {
                    $unwind: '$developerProfile'
                }
            ];

            if (search) {
                aggregationPipeline.push({
                    $match: {
                        $or: [
                            { username: { $regex: search, $options: 'i' } },
                            { email: { $regex: search, $options: 'i' } },
                            { 'developerProfile.expertise': { $regex: search, $options: 'i' } },
                            { 'developerProfile.languages': { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            if (skills.length > 0) {
                aggregationPipeline.push({
                    $match: {
                        'developerProfile.expertise': { $in: skills }
                    }
                });
            }
    
            if (languages.length > 0) {
                aggregationPipeline.push({
                    $match: {
                        'developerProfile.languages': { $in: languages }
                    }
                });
            }

            if (priceRange) {
                const priceMatch: any = {};
                if (priceRange.min !== undefined) {
                    priceMatch['developerProfile.hourlyRate'] = { 
                        ...priceMatch['developerProfile.hourlyRate'],
                        $gte: priceRange.min 
                    };
                }
                if (priceRange.max !== undefined) {
                    priceMatch['developerProfile.hourlyRate'] = { 
                        ...priceMatch['developerProfile.hourlyRate'],
                        $lte: priceRange.max 
                    };
                }
                if (Object.keys(priceMatch).length > 0) {
                    aggregationPipeline.push({ $match: priceMatch });
                }
            }

            if (location) {
                aggregationPipeline.push({
                    $match: {
                        location: { 
                            $regex: new RegExp(location, 'i')
                        }
                    }
                });
            }

            const sortStage: any = {};
            switch (sort) {
                case 'oldest':
                    sortStage.$sort = { createdAt: 1 };
                    break;
                case 'name_asc':
                    sortStage.$sort = { username: 1 };
                    break;
                case 'name_desc':
                    sortStage.$sort = { username: -1 };
                    break;
                case 'price_low':
                    sortStage.$sort = { 'developerProfile.hourlyRate': 1 };
                    break;
                case 'price_high':
                    sortStage.$sort = { 'developerProfile.hourlyRate': -1 };
                    break;
                default:
                    sortStage.$sort = { createdAt: -1 };
            }
            aggregationPipeline.push(sortStage);
    
            aggregationPipeline.push({
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    profilePicture: 1,
                    socialLinks: 1,
                    location: 1,
                    title: '$developerProfile.workingExperience.jobTitle',
                    developerProfile: {
                        title: '$developerProfile.workingExperience.jobTitle',
                        skills: '$developerProfile.expertise',
                        languages: '$developerProfile.languages',
                        hourlyRate: '$developerProfile.hourlyRate',
                        bio: '$bio'
                    }
                }
            });

            const countPipeline = [...aggregationPipeline];
            const countResult = await User.aggregate([
                ...countPipeline,
                { $count: 'total' }
            ]);
    
            const total = countResult[0]?.total || 0;

            aggregationPipeline.push(
                { $skip: (page - 1) * limit },
                { $limit: limit }
            );
    
            const developers = await User.aggregate(aggregationPipeline);
    
            return {
                developers: developers.map(this.transformDeveloperResponse),
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error in searchDevelopers:', error);
            throw error;
        }
    }

    async getPublicProfile(developerId: string) {
        try {
            const user = await User.findOne({ 
                _id: developerId,
                status: 'active',
                role: 'developer'
            });
    
            if (!user) {
                return null;
            }
    
            const developer = await Developer.findOne({
                userId: developerId,
                status: 'approved'
            });
    
            if (!developer) {
                return null;
            }
    
            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                location: user.location,
                socialLinks: user.socialLinks,
                developerProfile: {
                    title: developer.workingExperience?.jobTitle,
                    expertise: developer.expertise,
                    experience: developer.workingExperience?.experience,
                    languages: developer.languages,
                    education: developer.education,
                    workingExperience: developer.workingExperience,
                    hourlyRate: developer.hourlyRate,
                    rating: developer.rating,
                    totalSessions: developer.totalSessions,
                    portfolio: developer.portfolio
                }
            };
        } catch (error) {
            console.error('Error in getPublicProfile:', error);
            throw error;
        }
    }

    private transformDeveloperResponse(dev: any) {
        return {
            _id: dev._id.toString(),
            username: dev.username,
            email: dev.email,
            profilePicture: dev.profilePicture,
            title: dev.developerProfile.title,
            location: dev.location,
            socialLinks: {
                github: dev.socialLinks?.github,
                linkedin: dev.socialLinks?.linkedIn,
                twitter: dev.socialLinks?.twitter
            },
            developerProfile: {
                title: dev.developerProfile.title,
                skills: dev.developerProfile.skills,
                languages: dev.developerProfile.languages,
                hourlyRate: dev.developerProfile.hourlyRate,
                bio: dev.developerProfile.bio
            }
        };
    }
    
}

