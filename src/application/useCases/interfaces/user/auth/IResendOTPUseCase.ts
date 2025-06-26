export interface IResendOTPUseCase{
    execute(email: string): Promise<void>
}