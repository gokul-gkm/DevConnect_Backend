import { ChangePasswordDTO } from "@/application/dto/users/ChangePasswordDTO";

export interface IChangeUserPasswordUseCase{
    execute(userId: string, data: ChangePasswordDTO): Promise<void>
}