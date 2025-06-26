import { RegisterUserDTO } from "@/application/dto/RegisterUserDTO";

export interface IRegisterUserUseCase{
    execute(userData: RegisterUserDTO): Promise<void>
}