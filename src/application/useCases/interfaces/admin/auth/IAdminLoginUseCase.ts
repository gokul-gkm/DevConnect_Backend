import { LoginAdminDTO } from "@/application/dto/admin/LoginAdminDTO";
import { AdminLoginResponse } from "@/application/useCases/implements/admin/auth/AdminLoginUseCase";

export interface IAdminLoginUseCase{
    execute(loginData: LoginAdminDTO): Promise<AdminLoginResponse>
}