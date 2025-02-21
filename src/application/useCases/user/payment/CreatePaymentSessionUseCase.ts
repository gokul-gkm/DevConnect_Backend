import { Types } from 'mongoose';
import { IPaymentService } from '@/domain/interfaces/IPaymentService';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';

interface CreatePaymentSessionDTO {
  sessionId: string;
  successUrl: string;
  cancelUrl: string;
}

export class CreatePaymentSessionUseCase {
  constructor(
    private paymentService: IPaymentService,
    private sessionRepository: SessionRepository
  ) {}

  async execute(data: CreatePaymentSessionDTO): Promise<string> {
    if (!Types.ObjectId.isValid(data.sessionId)) {
      throw new AppError('Invalid session ID', 400);
    }

    const session = await this.sessionRepository.getSessionById(
      new Types.ObjectId(data.sessionId)
    );

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.paymentStatus === 'completed') {
      throw new AppError('Session is already paid for', 400);
    }

    if (!session.userId || !session.developerId) {
      throw new AppError('Invalid session data', 400);
    }

    const checkoutUrl = await this.paymentService.createCheckoutSession({
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