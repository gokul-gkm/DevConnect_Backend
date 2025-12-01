import { LoginUserDTO } from "@/application/dto/users/LoginUserDTO";
import { IUser } from "@/domain/entities/User";

export interface IDevLoginUseCase{
    execute(loginData: LoginUserDTO): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUser, "password">}>
}