export interface IResendOTPUseCase{
    execute(email: string): Promise<{ expiresAt: Date }>
}