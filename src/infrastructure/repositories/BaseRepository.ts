import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { IBaseRepository } from '@/domain/interfaces/IBaseRepository';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findById(id);
    } catch (error) {
      console.error(`Error finding document by ID: ${error}`);
      throw new AppError('Database operation failed', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

}