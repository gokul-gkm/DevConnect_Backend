export interface IProcessPaymentWebhookUseCase{
    execute(payload: string, signature: string): Promise<void>
}