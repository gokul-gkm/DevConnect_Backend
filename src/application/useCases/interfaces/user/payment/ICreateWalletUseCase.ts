import { Types } from "mongoose";

export interface ICreateWalletUseCase{
    execute(userId: Types.ObjectId): Promise<void>
}