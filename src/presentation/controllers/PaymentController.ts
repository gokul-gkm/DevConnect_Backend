import { Request, Response } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from '@/utils/constants';

import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { IPaymentRepository } from '@/domain/interfaces/IPaymentRepository';
import { StripeService } from '@/infrastructure/services/StripeService';

import { CreatePaymentSessionUseCase } from '@/application/useCases/implements/user/payment/CreatePaymentSessionUseCase';
import { ProcessPaymentWebhookUseCase } from '@/application/useCases/implements/user/payment/ProcessPaymentWebhookUseCase';
import { TransferToDevWalletUseCase } from '@/application/useCases/implements/user/payment/TransferToDevWalletUseCase';
import { GetWalletDetailsUseCase } from '@/application/useCases/implements/user/payment/GetWalletDetailsUseCase';
import { GetAdminWalletDetailsUseCase } from '@/application/useCases/implements/user/payment/GetAdminWalletDetailsUseCase';

import { ICreatePaymentSessionUseCase } from '@/application/useCases/interfaces/user/payment/ICreatePaymentSessionUseCase';
import { IProcessPaymentWebhookUseCase } from '@/application/useCases/interfaces/user/payment/IProcessPaymentWebhookUseCase';
import { ITransferToDevWalletUseCase } from '@/application/useCases/interfaces/user/payment/ITransferToDevWalletUseCase';
import { IGetWalletDetailsUseCase } from '@/application/useCases/interfaces/user/payment/IGetWalletDetailsUseCase';
import { IGetAdminWalletDetailsUseCase } from '@/application/useCases/interfaces/user/payment/IGetAdminWalletDetailsUseCase';

export class PaymentController {
  private _createPaymentSessionUseCase: ICreatePaymentSessionUseCase;
  private _processPaymentWebhookUseCase: IProcessPaymentWebhookUseCase;
  private _transferToDevWalletUseCase: ITransferToDevWalletUseCase;
  private _getWalletDetailsUseCase: IGetWalletDetailsUseCase;
  private _getAdminWalletDetailsUseCase: IGetAdminWalletDetailsUseCase;

  constructor(
    private _sessionRepository: ISessionRepository,
    private _walletRepository: IWalletRepository,
    private _paymentRepository: IPaymentRepository
  ) {
    const stripeService = new StripeService(
      _paymentRepository,
      _walletRepository,
      _sessionRepository
    );

    this._createPaymentSessionUseCase = new CreatePaymentSessionUseCase(
      stripeService,
      _sessionRepository
    );

    this._processPaymentWebhookUseCase = new ProcessPaymentWebhookUseCase(
      stripeService
    );

    this._transferToDevWalletUseCase = new TransferToDevWalletUseCase(
      _sessionRepository,
      _walletRepository,
    );

    this._getWalletDetailsUseCase = new GetWalletDetailsUseCase(
      _walletRepository
    );
    this._getAdminWalletDetailsUseCase = new GetAdminWalletDetailsUseCase(_walletRepository)
  }

  async createPaymentSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
     
      const checkoutUrl = await this._createPaymentSessionUseCase.execute({
        sessionId,
        successUrl: `${process.env.FRONTEND_URL}/payment/success?session_id=${sessionId}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?session_id=${sessionId}`
      });

      res.json({ url: checkoutUrl });
    } catch (error: any) {
      res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
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
    } catch (error: any) {
      console.error('Webhook Error:', error.message);
      res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Webhook processing failed'
      });
    }
  }

  async transferToDevWallet(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      await this._transferToDevWalletUseCase.execute(sessionId);

      res.json({ message: 'Payment transferred successfully' });
    } catch (error: any) {
      res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Transfer failed'
      });
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
    } catch (error: any) {
      res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Failed to fetch wallet details'
      });
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
    } catch (error: any) {
      res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Failed to fetch admin wallet details'
      });
    }
  }
  
}