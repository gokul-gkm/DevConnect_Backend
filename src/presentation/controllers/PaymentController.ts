import { Request, Response } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

import { ICreatePaymentSessionUseCase } from '@/application/useCases/interfaces/user/payment/ICreatePaymentSessionUseCase';
import { IProcessPaymentWebhookUseCase } from '@/application/useCases/interfaces/user/payment/IProcessPaymentWebhookUseCase';
import { ITransferToDevWalletUseCase } from '@/application/useCases/interfaces/user/payment/ITransferToDevWalletUseCase';
import { IGetWalletDetailsUseCase } from '@/application/useCases/interfaces/user/payment/IGetWalletDetailsUseCase';
import { IGetAdminWalletDetailsUseCase } from '@/application/useCases/interfaces/user/payment/IGetAdminWalletDetailsUseCase';
import { handleControllerError } from '../error/handleControllerError';

@injectable()
export class PaymentController {

  constructor(
    @inject(TYPES.ICreatePaymentSessionUseCase)
    private _createPaymentSessionUseCase: ICreatePaymentSessionUseCase,

    @inject(TYPES.IProcessPaymentWebhookUseCase)
    private _processPaymentWebhookUseCase: IProcessPaymentWebhookUseCase,

    @inject(TYPES.ITransferToDevWalletUseCase)
    private _transferToDevWalletUseCase: ITransferToDevWalletUseCase,

    @inject(TYPES.IGetWalletDetailsUseCase)
    private _getWalletDetailsUseCase: IGetWalletDetailsUseCase,

    @inject(TYPES.IGetAdminWalletDetailsUseCase)
    private _getAdminWalletDetailsUseCase: IGetAdminWalletDetailsUseCase
  ) {}

  async createPaymentSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
     
      const checkoutUrl = await this._createPaymentSessionUseCase.execute({
        sessionId,
        successUrl: `${process.env.FRONTEND_URL}/payment/success?session_id=${sessionId}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?session_id=${sessionId}`
      });

      res.json({ url: checkoutUrl });
    } catch (error: unknown) {
      handleControllerError(error, res, 'Failed to create payment session')
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        throw new AppError('No stripe signature found', StatusCodes.BAD_REQUEST);
      }
      console.log('Received webhook with signature:', signature);
      console.log('Webhook body:', req.body);
      await this._processPaymentWebhookUseCase.execute(
        req.body,
        signature
      );

      res.json({ received: true });
    } catch (error: unknown) {
      handleControllerError(error, res, 'Webhook processing failed')
    }
  }

  async transferToDevWallet(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      await this._transferToDevWalletUseCase.execute(sessionId);

      res.json({ message: 'Payment transferred successfully' });
    } catch (error: unknown) {
      handleControllerError(error, res, 'Transfer failed')
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(ERROR_MESSAGES.USER_REQUIRED, StatusCodes.BAD_REQUEST);
      }
      
      const wallet = await this._getWalletDetailsUseCase.execute(userId);
      res.json(wallet);
    } catch (error: unknown) {
      handleControllerError(error, res, 'Failed to fetch wallet details');
    }
  }

  async getAdminWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const adminId = process.env.ADMIN_ID!;
      if (!adminId) {
        throw new AppError('Admin ID is required', StatusCodes.BAD_REQUEST);
      }
      
      const wallet = await this._getAdminWalletDetailsUseCase.execute(adminId);
      res.json(wallet);
    } catch (error: unknown) {
      handleControllerError(error, res, 'Failed to fetch admin wallet details')
    }
  }
  
}