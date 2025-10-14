import { LoginAdminDTO } from "@/application/dto/LoginAdminDTO";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IAdminRepository } from "@/domain/interfaces/IAdminRepository";
import { IAdminLoginUseCase } from "../../../interfaces/admin/auth/IAdminLoginUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class AdminLoginUseCase implements IAdminLoginUseCase{
    
    constructor(
        @inject(TYPES.IAdminRepository)
        private _adminRepository: IAdminRepository
    ) {}

    async execute(loginData: LoginAdminDTO): Promise<{ accessToken: string; refreshToken: string; admin: any }> {
        const { email, password } = loginData;
        const admin = await this._adminRepository.findByEmail(email);
        if (!admin) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const accessToken = jwt.sign(
            { adminId: admin._id },
            process.env.JWT_ADMIN_ACCESS_SECRET as string,
            { expiresIn: process.env.ACCESS_EXPIRES_IN }
        );
        const refreshToken = jwt.sign(
            { adminId: admin._id },
            process.env.JWT_ADMIN_REFRESH_SECRET as string,
            { expiresIn: process.env.REFRESH_EXPIRES_IN}
        )
        return {
            accessToken,
            refreshToken,
            admin: {
                _id: admin._id,
                email: admin.email
            }
        };
    }
}