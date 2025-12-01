import { ChangePasswordDTO } from "@/application/dto/users/ChangePasswordDTO";

export interface IChangePasswordUseCase{
    execute(userId: string, data: ChangePasswordDTO): Promise<void>
}