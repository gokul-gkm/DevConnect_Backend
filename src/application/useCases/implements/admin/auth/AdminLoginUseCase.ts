import { LoginAdminDTO } from "@/application/dto/admin/LoginAdminDTO";
import bcrypt from "bcryptjs";
import { IAdminRepository } from "@/domain/interfaces/repositories/IAdminRepository";
import { IAdminLoginUseCase } from "../../../interfaces/admin/auth/IAdminLoginUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { IAdmin } from "@/domain/entities/Admin";
import jwt,  { SignOptions } from 'jsonwebtoken'
import {
  JWT_ADMIN_ACCESS_SECRET,
  JWT_ADMIN_REFRESH_SECRET,
  accessSignOptions,
  refreshSignOptions,
} from "@/infrastructure/config/jwt";

export type AdminLoginResponse = {
  accessToken: string;
  refreshToken: string;
  admin: Pick<IAdmin, "_id" | "email">;
};

@injectable()
export class AdminLoginUseCase implements IAdminLoginUseCase {
  constructor(
    @inject(TYPES.IAdminRepository)
    private _adminRepository: IAdminRepository
  ) {}

  async execute(
    loginData: LoginAdminDTO
  ): Promise<AdminLoginResponse> {
    const { email, password } = loginData;
    const admin = await this._adminRepository.findByEmail(email);
    if (!admin) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const accessToken = jwt.sign(
      { adminId: admin._id },
      JWT_ADMIN_ACCESS_SECRET,
      accessSignOptions
    );

    const refreshToken = jwt.sign(
      { adminId: admin._id },
      JWT_ADMIN_REFRESH_SECRET,
      refreshSignOptions
    );

    return {
      accessToken,
      refreshToken,
      admin: {
        _id: admin._id,
        email: admin.email,
      },
    };
  }
}
