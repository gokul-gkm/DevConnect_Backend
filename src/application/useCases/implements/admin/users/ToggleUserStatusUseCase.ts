import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { ERROR_MESSAGES } from "@/utils/constants";
import { IToggleUserStatusUseCase } from "@/application/useCases/interfaces/admin/users/IToggleUserStatusUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { IWalletRepository } from "@/domain/interfaces/repositories/IWalletRepository";
import { INotificationService } from "@/domain/interfaces/services/INotificationService";


@injectable()
export class ToggleUserStatusUseCase implements IToggleUserStatusUseCase {
  constructor(
    @inject(TYPES.IUserRepository)
    private readonly _userRepository: IUserRepository,

    @inject(TYPES.ISessionRepository)
    private readonly _sessionRepository: ISessionRepository,

    @inject(TYPES.IWalletRepository)
      private readonly _walletRepository: IWalletRepository,
    @inject(TYPES.INotificationService)
      private readonly _notificationService: INotificationService,
    
  ) {}

    async execute(userId: string): Promise<void> {
      console.log("in toggle usecase");
    const user = await this._userRepository.findById(userId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    const isBlocking = user.status === "active";
    user.status = isBlocking ? "blocked" : "active";

    await this._userRepository.save(user);

    if (isBlocking && user.role === "developer") {
      await this.handleDeveloperBlock(user._id.toString());
    }
    
  }

  private async handleDeveloperBlock(developerId: string) {
    const upcomingSessions =
      await this._sessionRepository.findUpcomingByDeveloperId(developerId);
    
    for (const session of upcomingSessions) {
      let refundSucceeded = false;

      if (session.paymentStatus === "completed" && session.developerId) {
    try {
      const refund = await this._walletRepository.processRefund(
        session._id.toString(),
        session.userId._id.toString(),
        session.developerId.toString(),
        session.price,
        "DEVELOPER_BLOCKED"
      );
      console.log("refund : ",refund)

        refundSucceeded = true;
    } catch (error) {
      console.log("error in refund : ",error)
      refundSucceeded = false;
    }
    

  }

  await this._sessionRepository.updateById(session._id.toString(), {
    status: "cancelled",
    cancellationReason: "DEVELOPER_BLOCKED",
    cancelledBy: "ADMIN",
    refundStatus: refundSucceeded ? "completed" : undefined,
  });

  if (refundSucceeded && session.developerId) {
    await this._notificationService.notify(
      session.userId._id.toString(),
      "Session refund",
      `Your session "${session.title}" has been cancelled because the assigned developer is no longer available. 
A full refund of ₹${session.price} has been successfully processed to your account.
`,
      "session",
      session.developerId.toString()
    );
  }
}
  }
}