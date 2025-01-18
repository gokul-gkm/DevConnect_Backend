import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";
import { IDeveloper } from "@/domain/entities/Developer";
import { AppError } from "@/domain/errors/AppError";
import { MailService } from "@/infrastructure/mail/MailService";

export class ManageDeveloperRequestsUseCase {
    private mailService: MailService;
    constructor(private developerRepository: DeveloperRepository) {
        this.mailService = new MailService()
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
            console.log(developer)
            if (!developer) {
                throw new AppError('Developer not found', 404);
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
                throw new AppError('Rejection reason is required', 400);
            }
            const developer = await this.developerRepository.updateDeveloperStatus(
                developerId,
                'rejected',
                reason
            );
            if (!developer) {
                throw new AppError('Developer not found', 404);
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