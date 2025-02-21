import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { DeveloperSearchDTO, DeveloperSearchResponse } from "@/application/dto/users/DeveloperSearchDTO";
import { AppError } from "@/domain/errors/AppError";
import { S3Service } from "@/infrastructure/services/S3_Service";

export class SearchDevelopersUseCase {
    constructor(
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) {}

    async execute(searchParams: DeveloperSearchDTO): Promise<DeveloperSearchResponse> {
        try {
            const {
                search = '',
                skills = [],
                experience,
                availability,
                location,
                sort = 'newest',
                page: pageParam = 1,
                limit: limitParam = 8
            } = searchParams;

            const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : pageParam;
            const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : limitParam;

            if (isNaN(page) || page < 1) {
                throw new AppError('Page must be greater than 0', 400);
            }

            if (isNaN(limit) || limit < 1) {
                throw new AppError('Limit must be greater than 0', 400);
            }

            if (limit > 50) {
                throw new AppError('Limit cannot exceed 50', 400);
            }

            const validSortOptions = ['newest', 'oldest', 'name_asc', 'name_desc', 'experience_high', 'experience_low'];
            if (sort && !validSortOptions.includes(sort)) {
                throw new AppError('Invalid sort option', 400);
            }

            const result = await this.developerRepository.searchDevelopers({
                search,
                skills,
                experience,
                availability,
                location,
                sort,
                page,
                limit
            });

            const developersWithUrls = await Promise.all(
                result.developers.map(async (developer) => {
                    const developerData = { ...developer };
                    if (developerData.profilePicture) {
                        try {
                            developerData.profilePicture = await this.s3Service.generateSignedUrl(developerData.profilePicture);
                        } catch (error) {
                            console.error('Error getting signed URL:', error);
                            developerData.profilePicture = null;
                        }
                    }
                    return developerData;
                })
            );

            return {
                ...result,
                developers: developersWithUrls,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to search developers', 500);
        }
    }
}