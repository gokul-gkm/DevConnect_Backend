import { Types } from 'mongoose';
import { IPaymentRepository } from '@/domain/interfaces/IPaymentRepository';
import { IPayment, PaymentModel } from '@/domain/entities/Payment';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { BaseRepository } from './BaseRepository';
import { injectable } from 'inversify';

@injectable()
export class PaymentRepository extends BaseRepository<IPayment> implements IPaymentRepository {
  constructor() {
    super(PaymentModel)
}
  
  async create(payment: Partial<IPayment>): Promise<IPayment> {
    try {
      const newPayment = new PaymentModel(payment);
      return await newPayment.save();
    } catch (error) {
      throw new AppError('Failed to create payment record', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async findByPaymentId(id: Types.ObjectId): Promise<IPayment | null> {
    try {
      return await PaymentModel.findById(id);
    } catch (error) {
      throw new AppError('Failed to fetch payment', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async findBySessionId(sessionId: Types.ObjectId): Promise<IPayment | null> {
    try {
      return await PaymentModel.findOne({ sessionId });
    } catch (error) {
      throw new AppError('Failed to fetch payment by session ID', StatusCodes.INTERNAL_SERVER_ERROR);
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
      throw new AppError('Failed to update payment status', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async findByStripeSessionId(stripeSessionId: string): Promise<IPayment | null> {
    try {
      return await PaymentModel.findOne({ stripeSessionId });
    } catch (error) {
      throw new AppError('Failed to fetch payment by Stripe session ID', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}