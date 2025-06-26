import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";
import { IDeveloper } from "@/domain/entities/Developer";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IGetDevelopersUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDevelopersUseCase";

export class GetDevelopersUseCase implements IGetDevelopersUseCase {
    constructor(
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
    ) { }

    async execute(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> {
        try {
            const developers = await this._developerRepository.findDevelopers(queryParams);

            const transformedData = await Promise.all(developers.data.map(async (developer) => {
                let signedProfilePictureUrl = null;
                
                if (developer.userId && (developer.userId as any).profilePicture) {
                    signedProfilePictureUrl = await this._s3Service.generateSignedUrl(
                        (developer.userId as any).profilePicture
                    );
                }

                return {
                    ...developer.toObject(),
                    userId: {
                        ...(developer.userId as any).toObject(),
                        profilePicture: signedProfilePictureUrl
                    }
                };
            }));

            return {
                data: transformedData,
                pagination: developers.pagination
            };
        } catch (error) {
            console.error('Error in ListDevelopersUseCase:', error);
            throw error;
        }
    }
}