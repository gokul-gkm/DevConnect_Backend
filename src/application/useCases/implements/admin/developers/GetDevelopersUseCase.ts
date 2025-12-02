import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";
import { IDeveloper } from "@/domain/entities/Developer";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IGetDevelopersUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDevelopersUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { IUser } from "@/domain/entities/User";

@injectable()
export class GetDevelopersUseCase implements IGetDevelopersUseCase {
    constructor(
        @inject(TYPES.IDeveloperRepository)
        private _developerRepository: IDeveloperRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service
    ) { }

    async execute(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> {
        try {
            const developers = await this._developerRepository.findDevelopers(queryParams);

            const transformedData = await Promise.all(developers.data.map(async (developer) => {
                const user = developer.userId as unknown as IUser | null;

                let signedProfilePictureUrl: string | null = null;

                if (user?.profilePicture) {
                    signedProfilePictureUrl = await this._s3Service.generateSignedUrl(
                        user.profilePicture
                    );
                }

                return {
                    ...developer.toObject(),
                    userId: user
                        ? {
                              ...user.toObject(),
                              profilePicture: signedProfilePictureUrl
                          }
                        : null
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