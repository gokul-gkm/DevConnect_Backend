import { LoginUserDTO } from "@/application/dto/LoginUserDTO";
import { IUser } from "@/domain/entities/User";

export interface ILoginUserUseCase{
    execute(loginData: LoginUserDTO): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUser, "password">}>
}