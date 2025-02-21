import { Request, Response } from 'express';
import { CreatePaymentSessionUseCase } from '@/application/useCases/user/payment/CreatePaymentSessionUseCase';
import { ProcessPaymentWebhookUseCase } from '@/application/useCases/user/payment/ProcessPaymentWebhookUseCase';
import { TransferToDevWalletUseCase } from '@/application/useCases/user/payment/TransferToDevWalletUseCase';
import { GetWalletDetailsUseCase } from '@/application/useCases/user/payment/GetWalletDetailsUseCase';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { PaymentRepository } from '@/infrastructure/repositories/PaymentRepository';
import { StripeService } from '@/infrastructure/services/StripeService';
import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { GetAdminWalletDetailsUseCase } from '@/application/useCases/user/payment/GetAdminWalletDetailsUseCase';

export class PaymentController {
  private createPaymentSessionUseCase: CreatePaymentSessionUseCase;
  private processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase;
  private transferToDevWalletUseCase: TransferToDevWalletUseCase;
  private getWalletDetailsUseCase: GetWalletDetailsUseCase;
  private getAdminWalletDetailsUseCase: GetAdminWalletDetailsUseCase;

  constructor(
    private sessionRepository: SessionRepository,
    private walletRepository: WalletRepository,
    private paymentRepository: PaymentRepository
  ) {
    const stripeService = new StripeService(
      paymentRepository,
      walletRepository,
      sessionRepository
    );

    this.createPaymentSessionUseCase = new CreatePaymentSessionUseCase(
      stripeService,
      sessionRepository
    );

    this.processPaymentWebhookUseCase = new ProcessPaymentWebhookUseCase(
      stripeService
    );

    this.transferToDevWalletUseCase = new TransferToDevWalletUseCase(
      sessionRepository,
      walletRepository,
    );

    this.getWalletDetailsUseCase = new GetWalletDetailsUseCase(
      walletRepository
    );
    this.getAdminWalletDetailsUseCase = new GetAdminWalletDetailsUseCase(walletRepository)
  }

  async createPaymentSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
     
      
      const checkoutUrl = await this.createPaymentSessionUseCase.execute({
        sessionId,
        successUrl: `${process.env.FRONTEND_URL}/payment/success?session_id=${sessionId}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?session_id=${sessionId}`
      });

      res.json({ url: checkoutUrl });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        message: error.message || 'Internal server error'
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        throw new AppError('No stripe signature found', 400);
      }
      console.log('Received webhook with signature:', signature);
      console.log('Webhook body:', req.body);
      await this.processPaymentWebhookUseCase.execute(
        req.body,
        signature
      );

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook Error:', error.message);
      res.status(error.statusCode || 500).json({
        message: error.message || 'Webhook processing failed'
      });
    }
  }

  async transferToDevWallet(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      await this.transferToDevWalletUseCase.execute(sessionId);

      res.json({ message: 'Payment transferred successfully' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        message: error.message || 'Transfer failed'
      });
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }
      
      const wallet = await this.getWalletDetailsUseCase.execute(userId);
      res.json(wallet);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        message: error.message || 'Failed to fetch wallet details'
      });
    }
  }

  async getAdminWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const adminId = process.env.ADMIN_ID!;
      if (!adminId) {
        throw new AppError('Admin ID is required', 400);
      }
      
      const wallet = await this.getAdminWalletDetailsUseCase.execute(adminId);
      res.json(wallet);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        message: error.message || 'Failed to fetch admin wallet details'
      });
    }
  }
  
}