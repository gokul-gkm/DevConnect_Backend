import { RegisterUserDTO } from "@/application/dto/RegisterUserDTO";

export interface IRegisterDevUseCase{
    execute(userData: RegisterUserDTO): Promise<void>
}