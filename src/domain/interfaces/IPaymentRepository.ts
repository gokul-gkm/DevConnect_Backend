import { Types } from 'mongoose';
import { IPayment } from '../entities/Payment';
import { IBaseRepository } from './IBaseRepository';

export interface IPaymentRepository {
  create(payment: Partial<IPayment>): Promise<IPayment>;
  findById(id: Types.ObjectId): Promise<IPayment | null>;
  findBySessionId(sessionId: Types.ObjectId): Promise<IPayment | null>;
  updateStatus(id: Types.ObjectId, status: string): Promise<IPayment | null>;
  findByStripeSessionId(stripeSessionId: string): Promise<IPayment | null>;
}