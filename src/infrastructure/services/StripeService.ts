import Stripe from 'stripe';
import { IPaymentService, CreateCheckoutSessionParams } from '@/domain/interfaces/IPaymentService';
import { AppError } from '@/domain/errors/AppError';
import { IPaymentRepository } from '@/domain/interfaces/IPaymentRepository';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { ObjectId, Types } from 'mongoose';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';

export class StripeService implements IPaymentService {
  private stripe: Stripe;
  
  constructor(
    private paymentRepository: IPaymentRepository,
    private walletRepository: IWalletRepository,
    private sessionRepository: ISessionRepository,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27.acacia',
    });
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: params.currency,
            product_data: {
              name: 'Developer Session',
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          sessionId: params.sessionId.toString(),
          ...params.metadata
        },
      });


      await this.paymentRepository.create({
        sessionId: params.sessionId,
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        stripeSessionId: session.id,
        metadata: params.metadata
      });

      return session.url!;
    } catch (error) {
      console.error('Stripe checkout session creation error:', error);
      throw new AppError('Failed to create payment session', 500);
    }
  }

  async handleWebhookEvent(payload: any, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const sessionId = new Types.ObjectId(session.metadata?.sessionId);
          const amount = session.amount_total! / 100;

          const payment = await this.paymentRepository.findByStripeSessionId(session.id);
          if (!payment) {
            throw new AppError('Payment record not found', 404);
          }

          await this.paymentRepository.updateStatus(payment._id, 'completed');

          const adminWallet = await this.walletRepository.findByAdminId(process.env.ADMIN_ID!);

          if (!adminWallet) {
            throw new AppError('Admin wallet not found', 404);
          }

          await this.walletRepository.addTransaction(adminWallet._id, {
            amount,
            type: 'credit',
            status: 'completed',
            description: 'Payment received for session booking',
            sessionId,
            metadata: { stripeSessionId: session.id }
          });

          await this.sessionRepository.updatePaymentStatus(sessionId, 'completed');
          await this.sessionRepository.updateSessionStatus(sessionId, 'scheduled')

          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const payment = await this.paymentRepository.findByStripeSessionId(charge.payment_intent as string);
          
          if (payment) {
            await this.paymentRepository.updateStatus(payment._id, 'refunded');
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const payment = await this.paymentRepository.findByStripeSessionId(paymentIntent.id);
          
          if (payment) {
            await this.paymentRepository.updateStatus(payment._id, 'failed');
          }
          break;
        }
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw new AppError('Failed to process webhook event', 500);
    }
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<void> {
    try {
      const payment = await this.paymentRepository.findById(new Types.ObjectId(paymentId));
      if (!payment || !payment.stripePaymentId) {
        throw new AppError('Payment not found', 404);
      }

      await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      await this.paymentRepository.updateStatus(payment._id, 'refunded');
    } catch (error) {
      console.error('Refund error:', error);
      throw new AppError('Failed to process refund', 500);
    }
  }
}