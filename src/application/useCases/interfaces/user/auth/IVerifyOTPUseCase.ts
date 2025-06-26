import { VerifyOTPDTO } from "@/application/dto/VerifyOTPDTO";

export interface IVerifyOTPUseCase{
    execute({ email, otp } : VerifyOTPDTO): Promise<any>
}