import { LoginAdminDTO } from "@/application/dto/admin/LoginAdminDTO";

export interface IAdminLoginUseCase{
    execute(loginData: LoginAdminDTO): Promise<{ accessToken: string; refreshToken: string; admin: any }>
}