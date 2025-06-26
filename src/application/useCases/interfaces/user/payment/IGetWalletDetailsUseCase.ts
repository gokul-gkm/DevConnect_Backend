import { IWallet } from "@/domain/entities/Wallet";

export interface IGetWalletDetailsUseCase{
    execute(userId: string): Promise<IWallet>
}