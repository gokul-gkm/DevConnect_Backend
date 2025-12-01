import { Types } from 'mongoose';

export interface CreateCheckoutSessionParams {
  sessionId: Types.ObjectId;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

export interface IPaymentService {
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string>;
  handleWebhookEvent(payload: Buffer | string, signature: string): Promise<void>;
  validateWebhookSignature(payload: string, signature: string): boolean;
  refundPayment(paymentId: string, amount?: number): Promise<void>;
}