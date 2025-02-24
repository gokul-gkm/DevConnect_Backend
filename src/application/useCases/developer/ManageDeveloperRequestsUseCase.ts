import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";
import { IDeveloper } from "@/domain/entities/Developer";
import { AppError } from "@/domain/errors/AppError";
import { MailService } from "@/infrastructure/mail/MailService";
import { WalletRepository } from "@/infrastructure/repositories/WalletRepository";
import { Schema, Types } from "mongoose";
import { StatusCodes } from "http-status-codes";

export class ManageDeveloperRequestsUseCase {
    private mailService: MailService;
    constructor(
        private developerRepository: DeveloperRepository,
        private walletRepository: WalletRepository
    ) {
        this.mailService = new MailService();
        this.walletRepository = walletRepository;
    }

    async listRequests(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> {
        try {
            return await this.developerRepository.findDevelopers({
                ...queryParams,
                status: 'pending'
            });
        } catch (error) {
            console.error('Error in ListDeveloperRequestsUseCase:', error);
            throw error;
        }
    }

    async approveRequest(developerId: string): Promise<IDeveloper> {
        try {
            const developer = await this.developerRepository.updateDeveloperStatus(
                developerId,
                'approved'
            );

            if (!developer) {
                throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
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

                const existingWallet = await this.walletRepository.findByUserId(userObjectId);
                
                if (!existingWallet) {
                    await this.walletRepository.create(userObjectId);
                } else {
                    console.log(`Wallet already exists for developer: ${userObjectId}`);
                }

            } catch (error) {
                console.error('Detailed wallet creation error:', error);
                await this.developerRepository.updateDeveloperStatus(
                    developerId,
                    'pending'
                );
                throw new AppError('Failed to create developer wallet', StatusCodes.INTERNAL_SERVER_ERROR);
            }
            
            try {
                if (developer.userId && developer.userId instanceof Object && 'email' in developer.userId && 'username' in developer.userId) {
                    await this.mailService.sendDeveloperApprovalMail(
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
            const developer = await this.developerRepository.updateDeveloperStatus(
                developerId,
                'rejected',
                reason
            );
            if (!developer) {
                throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
            }

            try {
                if (developer.userId && typeof developer.userId === 'object' && 'email' in developer.userId && 'username' in developer.userId) {
                    await this.mailService.sendDeveloperRejectionMail(
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