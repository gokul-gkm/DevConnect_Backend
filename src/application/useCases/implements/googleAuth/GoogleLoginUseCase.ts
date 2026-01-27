import { injectable, inject } from "inversify";
import { OAuth2Client } from "google-auth-library";
import { Types } from "mongoose";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { IWalletRepository } from "@/domain/interfaces/repositories/IWalletRepository";
import { User } from "@/domain/entities/User";
import { IGoogleLoginUseCase, IGoogleLoginResponse } from "@/application/useCases/interfaces/googleAuth/IGoogleLoginUseCase";
import { TYPES } from "@/types/types";
import jwt from 'jsonwebtoken'
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  accessSignOptions,
  refreshSignOptions,
} from "@/infrastructure/config/jwt";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@injectable()
export class GoogleLoginUseCase implements IGoogleLoginUseCase {
    constructor(
        @inject(TYPES.IUserRepository)
        private _userRepository: IUserRepository,

        @inject(TYPES.IWalletRepository)
        private _walletRepository: IWalletRepository
    ) {}

    async execute(token: string): Promise<IGoogleLoginResponse> {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new AppError("Invalid Google token", StatusCodes.BAD_REQUEST);
        }

        const { email, name, picture, sub } = payload;

        if (!email) {
           throw  new AppError("Email not found from Google", StatusCodes.BAD_REQUEST);
        }

        let user = await this._userRepository.findByEmail(email!);

        if (user && user.status === "blocked") {
            throw new AppError("User account is blocked", StatusCodes.BAD_REQUEST);
        }
       

        if (!user) {

            const emailLocalPart = email.split("@")[0];

            let baseName = "";
            if (name) {
                const normalizedGoogleName = this.normalizeName(name);
                if (this.isValidName(normalizedGoogleName)) {
                baseName = normalizedGoogleName;
                }
            }

            if (!baseName) {
                const normalizedEmailName = this.normalizeName(emailLocalPart);
                if (this.isValidName(normalizedEmailName)) {
                baseName = normalizedEmailName;
                }
            }

            if (!baseName) {
                baseName = "user";
            }

            const uniqueUsername = await this.generateUniqueUsername(
                baseName,
                emailLocalPart
            );


            const newUser = new User({
                email,
                username: uniqueUsername,
                googleId: sub,
                password: "",
                contact: null,
                profilePicture: picture,
                role: "user",
                isVerified: true,
            });

            user = await this._userRepository.save(newUser);
        }

        const existingWallet = await this._walletRepository.findByUserId(new Types.ObjectId(user._id));

        if (!existingWallet) {
            try {
                await this._walletRepository.create(new Types.ObjectId(user._id));
            } catch (_error) {
                if (!user.createdAt) {
                    await this._userRepository.deleteById(user._id.toString());
                }
                throw new AppError("Failed to create user wallet", StatusCodes.INTERNAL_SERVER_ERROR);
            }
        }

        const accessToken = jwt.sign(
            { userId: user._id, role: "user" },
            JWT_ACCESS_SECRET,
            accessSignOptions
        );

        const refreshToken = jwt.sign(
            { userId: user._id, role: "user" },
            JWT_REFRESH_SECRET,
            refreshSignOptions
        );

        return { user, accessToken, refreshToken };
    }

   private normalizeName(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9 ]/g, "");
  }

  private isValidName(name: string): boolean {
    if (name.length < 3 || name.length > 40) return false;
    const letterCount = (name.match(/[a-zA-Z]/g) || []).length;
    return letterCount >= 3;
  }

  private async generateUniqueUsername(
    baseName: string,
    emailLocalPart: string
  ): Promise<string> {
    const base = emailLocalPart
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    let candidate = base || baseName.replace(/\s+/g, "").toLowerCase();
    let counter = 1;

    while (await this._userRepository.findByUsername(candidate)) {
      candidate = `${base}${counter}`;
      counter++;
    }

    return candidate;
  }
}
