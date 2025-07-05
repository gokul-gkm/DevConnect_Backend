import { ResetPasswordDTO } from "@/application/dto/users/ResetPasswordDTO";

export interface IResetPasswordUseCase{
    execute(data: ResetPasswordDTO): Promise<void>
}