import { LoginAdminDTO } from "@/application/dto/LoginAdminDTO";
import { AdminRepository } from "@/infrastructure/repositories/AdminRepository";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IAdmin } from "@/domain/entities/Admin";

export class AdminLoginUseCase{
    private adminRepository: AdminRepository;
    constructor(adminRepository: AdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(loginData: LoginAdminDTO): Promise<{ accessToken: string; refreshToken: string; admin: any }> {
        const { email, password } = loginData;
        const admin = await this.adminRepository.findByEmail(email);
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
            { expiresIn: "24h" }
        );
        const refreshToken = jwt.sign(
            { adminId: admin._id },
            process.env.JWT_ADMIN_REFRESH_SECRET as string,
            { expiresIn: '7d' }
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