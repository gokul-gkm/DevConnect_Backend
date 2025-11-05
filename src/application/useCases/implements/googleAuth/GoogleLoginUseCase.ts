import { injectable, inject } from "inversify";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { IWalletRepository } from "@/domain/interfaces/repositories/IWalletRepository";
import { User } from "@/domain/entities/User";
import { IGoogleLoginUseCase, IGoogleLoginResponse } from "@/application/useCases/interfaces/googleAuth/IGoogleLoginUseCase";
import { TYPES } from "@/types/types";

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
        let user = await this._userRepository.findByEmail(email!);

        if (user && user.status === "blocked") {
            throw new AppError("User account is blocked", StatusCodes.BAD_REQUEST);
        }

        if (!user) {
            const newUser = new User({
                email,
                username: name,
                googleId: sub,
                password: "",
                contact: Number("0000000000"),
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
                    await this._userRepository.deleteById(user._id);
                }
                throw new AppError("Failed to create user wallet", StatusCodes.INTERNAL_SERVER_ERROR);
            }
        }

        const accessToken = jwt.sign(
            { userId: user._id, role: "user" },
            process.env.JWT_ACCESS_SECRET as string,
            { expiresIn: process.env.ACCESS_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId: user._id, role: "user" },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: process.env.REFRESH_EXPIRES_IN }
        );

        return { user, accessToken, refreshToken };
    }
}
