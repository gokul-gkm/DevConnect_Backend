import { VerifyOTPDTO } from "@/application/dto/users/VerifyOTPDTO";

export interface IVerifyOTPUseCase{
    execute({ email, otp } : VerifyOTPDTO): Promise<any>
}