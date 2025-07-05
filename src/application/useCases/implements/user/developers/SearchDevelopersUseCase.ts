import { DeveloperSearchDTO, DeveloperSearchResponse } from "@/application/dto/users/DeveloperSearchDTO";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ISearchDevelopersUseCase } from "@/application/useCases/interfaces/user/developers/ISearchDevelopersUseCase";

export class SearchDevelopersUseCase implements ISearchDevelopersUseCase {
    constructor(
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
    ) {}

    async execute(searchParams: DeveloperSearchDTO): Promise<DeveloperSearchResponse> {
        try {
            const {
                search = '',
                skills = [],
                languages = [],
                priceRange,
                location = '',
                sort = 'newest',
                page: pageParam = 1,
                limit: limitParam = 8
            } = searchParams;
    
            const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : pageParam;
            const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : limitParam;

            if (isNaN(page) || page < 1) {
                throw new AppError('Page must be greater than 0', StatusCodes.BAD_REQUEST);
            }
    
            if (isNaN(limit) || limit < 1) {
                throw new AppError('Limit must be greater than 0', StatusCodes.BAD_REQUEST);
            }
    
            if (limit > 50) {
                throw new AppError('Limit cannot exceed 50', StatusCodes.BAD_REQUEST);
            }

            const validSortOptions = ['newest', 'oldest', 'name_asc', 'name_desc', 'price_low', 'price_high'];
            if (sort && !validSortOptions.includes(sort)) {
                throw new AppError('Invalid sort option', StatusCodes.BAD_REQUEST);
            }

            let validatedPriceRange;
            if (priceRange) {
                const min = typeof priceRange.min === 'string' ? parseFloat(priceRange.min) : priceRange.min;
                const max = typeof priceRange.max === 'string' ? parseFloat(priceRange.max) : priceRange.max;
    
                if ((min !== undefined && isNaN(min)) || (max !== undefined && isNaN(max))) {
                    throw new AppError('Invalid price range values', StatusCodes.BAD_REQUEST);
                }
    
                if (min !== undefined && max !== undefined && min > max) {
                    throw new AppError('Minimum price cannot be greater than maximum price', StatusCodes.BAD_REQUEST);
                }
    
                validatedPriceRange = { min, max };
            }
    
            const validatedSkills = Array.isArray(skills) ? skills : [];
            const validatedLanguages = Array.isArray(languages) ? languages : [];
    
            const result = await this._developerRepository.searchDevelopers({
                search,
                skills: validatedSkills,
                languages: validatedLanguages,
                priceRange: validatedPriceRange,
                location,
                sort,
                page,
                limit
            });
    
            const developersWithUrls = await Promise.all(
                result.developers.map(async (developer) => {
                    if (developer.profilePicture) {
                        try {
                            developer.profilePicture = await this._s3Service.generateSignedUrl(developer.profilePicture);
                        } catch (error) {
                            console.error('Error getting signed URL:', error);
                            developer.profilePicture = null;
                        }
                    }
                    return developer;
                })
            );
    
            return {
                ...result,
                developers: developersWithUrls,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to search developers', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}