import { Types } from 'mongoose';
import { IPaymentService } from '@/domain/interfaces/IPaymentService';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { ICreatePaymentSessionUseCase } from '@/application/useCases/interfaces/user/payment/ICreatePaymentSessionUseCase';

export interface CreatePaymentSessionDTO {
  sessionId: string;
  successUrl: string;
  cancelUrl: string;
}

export class CreatePaymentSessionUseCase implements ICreatePaymentSessionUseCase {
  constructor(
    private _paymentService: IPaymentService,
    private _sessionRepository: ISessionRepository
  ) {}

  async execute(data: CreatePaymentSessionDTO): Promise<string> {
    if (!Types.ObjectId.isValid(data.sessionId)) {
      throw new AppError('Invalid session ID', StatusCodes.BAD_REQUEST);
    }

    const session = await this._sessionRepository.getSessionById(
      new Types.ObjectId(data.sessionId)
    );

    if (!session) {
      throw new AppError('Session not found', StatusCodes.NOT_FOUND);
    }

    if (session.paymentStatus === 'completed') {
      throw new AppError('Session is already paid for', StatusCodes.BAD_REQUEST);
    }

    if (!session.userId || !session.developerId) {
      throw new AppError('Invalid session data', StatusCodes.BAD_REQUEST);
    }

    const checkoutUrl = await this._paymentService.createCheckoutSession({
      sessionId: new Types.ObjectId(data.sessionId),
      amount: session.price,
      currency: 'USD',
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      metadata: {
        userId: session.userId.toString(),
        developerId: session.developerId.toString()
      }
    });

    return checkoutUrl;
  }
}