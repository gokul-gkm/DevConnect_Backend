import { Document, FilterQuery, UpdateQuery } from 'mongoose';

export interface IBaseRepository<T extends Document> {
  findById(id: string): Promise<T | null>;
  deleteById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
}