import { IPaymentService } from '@/domain/interfaces/IPaymentService';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { IProcessPaymentWebhookUseCase } from '@/application/useCases/interfaces/user/payment/IProcessPaymentWebhookUseCase';

export class ProcessPaymentWebhookUseCase implements IProcessPaymentWebhookUseCase {
  constructor(
    private _paymentService: IPaymentService
  ) { }

  async execute(payload: string, signature: string): Promise<void> {
    if (!this._paymentService.validateWebhookSignature(payload, signature)) {
      throw new AppError('Invalid webhook signature', StatusCodes.BAD_REQUEST);
    }

    await this._paymentService.handleWebhookEvent(payload, signature);
  }
}