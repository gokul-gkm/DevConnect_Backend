import e, { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { User } from "@/domain/entities/User";
import jwt from 'jsonwebtoken';
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { WalletRepository } from "@/infrastructure/repositories/WalletRepository";
import { Types } from "mongoose";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class GoogleAuthController {
    constructor(
        private userRepository: UserRepository,
        private walletRepository: WalletRepository
    ) { }

    async googleLogin(req: Request, res: Response) { 
        const { token } = req.body;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            if (!payload) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid token', success: false });
            }
            const { email, name, picture, sub } = payload;
            let user = await this.userRepository.findByEmail(email!);

            if (user && user.status === 'blocked') {
                throw new AppError('User account is blocked',StatusCodes.BAD_REQUEST);
            }
            

            if (!user) {
                const newUser = new User({
                    email,
                    username: name,
                    googleId: sub,
                    password: '',
                    contact: Number("0000000000"),
                    profilePicture: picture,
                    role: 'user',
                    isVerified: true
                });
               

                user = await this.userRepository.save(newUser);
            }

            const existingWallet = await this.walletRepository.findByUserId(new Types.ObjectId(user._id));
            
            if (!existingWallet) {
                try {
                    console.log(`Creating wallet for user: ${user._id}`);
                    await this.walletRepository.create(new Types.ObjectId(user._id));
                } catch (error) {
                    console.error('Wallet creation error:', error);
                    if (!user.createdAt) {
                        await this.userRepository.deleteById(user._id);
                    }
                    throw new AppError('Failed to create user wallet', StatusCodes.INTERNAL_SERVER_ERROR);
                }
            }

            const accessToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_ACCESS_SECRET as string,
                { expiresIn: "24h" }
            );

            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET as string,
                { expiresIn: '7d' }
            );

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(StatusCodes.OK).json({ message: 'Google login successful', user, success: true, token: accessToken });
        } catch (error: any) {
            console.error('Google login error: ', error);
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }

            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.message || 'Google Login Error', success: false });
        }
    }
}