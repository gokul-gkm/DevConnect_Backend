import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";
import { IDeveloper } from "@/domain/entities/Developer";
import { AppError } from "@/domain/errors/AppError";
import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "@/utils/constants";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IWalletRepository } from "@/domain/interfaces/repositories/IWalletRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IManageDeveloperRequestsUseCase } from "@/application/useCases/interfaces/admin/developers/IManageDeveloperRequestsUseCase";
import { IMailService } from "@/domain/interfaces/services/IMailService";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { IUser } from "@/domain/entities/User";

type PopulatedUser = IUser & { profilePicture?: string };

function isPopulatedUser(
    user: IDeveloper["userId"] | PopulatedUser | null | undefined
): user is PopulatedUser {
    return !!user && typeof user === "object" && "profilePicture" in user;
}

@injectable()
export class ManageDeveloperRequestsUseCase implements IManageDeveloperRequestsUseCase {

    constructor(
        @inject(TYPES.IDeveloperRepository)
        private _developerRepository: IDeveloperRepository,
        @inject(TYPES.IWalletRepository)
        private _walletRepository: IWalletRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service,
        @inject(TYPES.IMailService)
        private _mailService: IMailService
    ) {
      
    }
    async listRequests(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> {
        try {
            const developers = await this._developerRepository.findDevelopers({
                ...queryParams,
                status: 'pending'
            });

            const transformedData = await Promise.all(developers.data.map(async (developer) => {
                let signedProfilePictureUrl: string | null = null;
                let signedResumeUrl: string | null = null;

                if (isPopulatedUser(developer.userId) && developer.userId.profilePicture) {
                    signedProfilePictureUrl = await this._s3Service.generateSignedUrl(
                        developer.userId.profilePicture
                    );
                }
                if (developer.resume) {
                    signedResumeUrl = await this._s3Service.generateSignedUrl(developer.resume);
                }

                return {
                    ...developer.toObject(),
                    userId: isPopulatedUser(developer.userId)
                        ? {
                              ...developer.userId,
                              profilePicture: signedProfilePictureUrl
                          }
                        : developer.userId,
                    resume: signedResumeUrl
                };
            }));

            return {
                data: transformedData,
                pagination: developers.pagination
            };
        } catch (error) {
            console.error('Error in ListDeveloperRequestsUseCase:', error);
            throw error;
        }
    }

    async approveRequest(developerId: string): Promise<IDeveloper> {
        try {
            const developer = await this._developerRepository.updateDeveloperStatus(
                developerId,
                'approved'
            );

            if (!developer) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }
         
            try {        
                let userObjectId: Types.ObjectId;

                if (developer.userId && typeof developer.userId === 'object' && '_id' in developer.userId) {
                    userObjectId = developer.userId._id as Types.ObjectId;

                } else if (developer.userId instanceof Types.ObjectId) {
                    userObjectId = developer.userId;
                } else if (typeof developer.userId === 'string') {
                    userObjectId = new Types.ObjectId(developer.userId);
                } else {
                    throw new AppError('Invalid userId format', StatusCodes.BAD_REQUEST);
                }

                const existingWallet = await this._walletRepository.findByUserId(userObjectId);
                
                if (!existingWallet) {
                    await this._walletRepository.create(userObjectId);
                } else {
                    console.log(`Wallet already exists for developer: ${userObjectId}`);
                }

            } catch (error) {
                console.error('Detailed wallet creation error:', error);
                await this._developerRepository.updateDeveloperStatus(
                    developerId,
                    'pending'
                );
                throw new AppError('Failed to create developer wallet', StatusCodes.INTERNAL_SERVER_ERROR);
            }
            
            try {
                if (developer.userId && developer.userId instanceof Object && 'email' in developer.userId && 'username' in developer.userId) {
                    await this._mailService.sendDeveloperApprovalMail(
                        developer.userId.email as string,
                        developer.userId.username as string
                    );
                } else {
                    console.error('Developer user ID or email/username is missing');
                }
            } catch (emailError) {
                console.error('Error sending approval email:', emailError);
            }

            return developer;
        } catch (error) {
            console.error('Error in ApproveDeveloperRequest:', error);
            throw error;
        }
    }

    async rejectRequest(developerId: string, reason: string): Promise<IDeveloper> {
        try {
            if (!reason) {
                throw new AppError('Rejection reason is required', StatusCodes.BAD_REQUEST);
            }
            const developer = await this._developerRepository.updateDeveloperStatus(
                developerId,
                'rejected',
                reason
            );
            if (!developer) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            try {
                if (developer.userId && typeof developer.userId === 'object' && 'email' in developer.userId && 'username' in developer.userId) {
                    await this._mailService.sendDeveloperRejectionMail(
                        developer.userId.email as string,
                        developer.userId.username as string,
                        reason
                    );
                } else {
                    console.error('Developer user ID or email/username is missing');
                }
            } catch (emailError) {
                console.error('Error sending rejection email:', emailError);
            }
            return developer;
        } catch (error) {
            console.error('Error in RejectDeveloperRequest:', error);
            throw error;
        }
    }
}