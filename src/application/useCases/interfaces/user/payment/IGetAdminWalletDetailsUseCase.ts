import { IWallet } from "@/domain/entities/Wallet";

export interface IGetAdminWalletDetailsUseCase{
    execute(adminId: string): Promise<IWallet>
}