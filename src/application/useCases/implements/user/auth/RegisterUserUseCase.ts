import bcrypt from 'bcryptjs';
import { RegisterUserDTO } from "@/application/dto/RegisterUserDTO";
import { User } from "@/domain/entities/User";
import { generateOTP } from '@/shared/utils/OTPGenerator';
import { OTP } from '@/domain/entities/OTP';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IOTPRepository } from '@/domain/interfaces/IOTPRepository';
import { IMailService } from '@/domain/interfaces/IMailService';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { IRegisterUserUseCase } from '@/application/useCases/interfaces/user/auth/IRegisterUserUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class RegisterUserUseCase implements IRegisterUserUseCase{

    constructor(
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
        @inject(TYPES.IOTPRepository) private _otpRepository: IOTPRepository,
        @inject(TYPES.IMailService) private _mailService: IMailService,
        @inject(TYPES.IWalletRepository) private _walletRepository: IWalletRepository
    ) { }

    async execute(userData: RegisterUserDTO): Promise<void> {
        const { username, email, contact, password, confirmPassword } = userData;
        
        if (password !== confirmPassword) {
            throw new AppError("Passwords don't match", StatusCodes.BAD_REQUEST)
        }

        const existingUser = await this._userRepository.findByEmail(email);
        if (existingUser) {
            if (existingUser.isVerified) {
                throw new AppError('Email already registered',StatusCodes.BAD_REQUEST)
            }
            if (existingUser.verificationExpires < new Date()) {
                await this._userRepository.deleteById(existingUser._id)
            } else {
                const otp = generateOTP();
                const otpRecord = new OTP({
                    email,
                    otp,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 1 * 60 * 1000),
                });
                await this._otpRepository.save(otpRecord);
                try {
                    await this._mailService.sendOTP(email, otp);
                    throw new AppError('Please verify your existing registration. A new OTP has been sent to your email.', StatusCodes.BAD_REQUEST);
                } catch (error) {
                    console.error(error);
                    
                    if (error instanceof AppError && error.message === 'Please verify your existing registration. A new OTP has been sent to your email.') {
                        throw error;
                    }
                
                    throw new AppError('Failed to resend OTP email', StatusCodes.INTERNAL_SERVER_ERROR);
                }

            }
        }
        const existingUsername = await this._userRepository.findByUsername(username);
        
        if (existingUsername) {
            throw new AppError('Username already exists',StatusCodes.BAD_REQUEST)
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            contact,
            role: 'user',
            isVerified: false,
            verificationExpires: new Date(Date.now()+ 24 * 60 * 60 * 1000)
        });

        const savedUser = await this._userRepository.save(newUser);

        try {
            await this._walletRepository.create(new Types.ObjectId(savedUser._id));
        } catch (error) {
            await this._userRepository.deleteById(savedUser._id);
            throw new AppError('Failed to create user wallet', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
        const otp = generateOTP();
        console.log("Signup OTP: ",otp);
        const otpRecord = new OTP({
            email,
            otp,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 1 * 60 * 1000)
        })
        await this._otpRepository.save(otpRecord)
        try {
            await this._mailService.sendOTP(email,otp)
        } catch (error) {
            await this._otpRepository.deleteByEmail(email);
            throw new AppError('Failed to send OTP email', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }
}