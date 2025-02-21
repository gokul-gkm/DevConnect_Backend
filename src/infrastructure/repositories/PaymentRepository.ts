import { Types } from 'mongoose';
import { IPaymentRepository } from '@/domain/interfaces/IPaymentRepository';
import { IPayment } from '@/domain/entities/Payment';
import { PaymentModel } from '@/domain/entities/Payment';
import { AppError } from '@/domain/errors/AppError';

export class PaymentRepository implements IPaymentRepository {
  async create(payment: Partial<IPayment>): Promise<IPayment> {
    try {
      const newPayment = new PaymentModel(payment);
      return await newPayment.save();
    } catch (error) {
      throw new AppError('Failed to create payment record', 500);
    }
  }

  async findById(id: Types.ObjectId): Promise<IPayment | null> {
    try {
      return await PaymentModel.findById(id);
    } catch (error) {
      throw new AppError('Failed to fetch payment', 500);
    }
  }

  async findBySessionId(sessionId: Types.ObjectId): Promise<IPayment | null> {
    try {
      return await PaymentModel.findOne({ sessionId });
    } catch (error) {
      throw new AppError('Failed to fetch payment by session ID', 500);
    }
  }

  async updateStatus(id: Types.ObjectId, status: string): Promise<IPayment | null> {
    try {
      return await PaymentModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      );
    } catch (error) {
      throw new AppError('Failed to update payment status', 500);
    }
  }

  async findByStripeSessionId(stripeSessionId: string): Promise<IPayment | null> {
    try {
      return await PaymentModel.findOne({ stripeSessionId });
    } catch (error) {
      throw new AppError('Failed to fetch payment by Stripe session ID', 500);
    }
  }
}