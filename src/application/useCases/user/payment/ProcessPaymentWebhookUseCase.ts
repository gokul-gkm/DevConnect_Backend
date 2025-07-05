import { IPaymentService } from '@/domain/interfaces/IPaymentService';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';

export class ProcessPaymentWebhookUseCase {
  constructor(private paymentService: IPaymentService) {}

  async execute(payload: string, signature: string): Promise<void> {
    if (!this.paymentService.validateWebhookSignature(payload, signature)) {
      throw new AppError('Invalid webhook signature', StatusCodes.BAD_REQUEST);
    }

    await this.paymentService.handleWebhookEvent(payload, signature);
  }
}