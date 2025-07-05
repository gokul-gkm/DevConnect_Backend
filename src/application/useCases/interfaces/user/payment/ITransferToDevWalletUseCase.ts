export interface ITransferToDevWalletUseCase{
    execute(sessionId: string): Promise<void>
}