import bcrypt from 'bcryptjs';
import { RegisterUserDTO } from "@/application/dto/RegisterUserDTO";
import { User } from "@/domain/entities/User";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { generateOTP } from '@/shared/utils/OTPGenerator';
import { MailService } from '@/infrastructure/mail/MailService';
import { OTP } from '@/domain/entities/OTP';
import { OTPRepository } from '@/infrastructure/repositories/OTPRepository';
import { AppError } from '@/domain/errors/AppError';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';


export class RegisterUserUseCase{
    private userRepository: UserRepository;
    private otpRepository: OTPRepository;
    private mailService: MailService;
    private walletRepository: WalletRepository

    constructor(userRepository: UserRepository, otpRepository : OTPRepository, mailService: MailService, walletRepository: WalletRepository) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.mailService = mailService;
        this.walletRepository = walletRepository;
    }

    async execute(userData: RegisterUserDTO): Promise<void> {
        const { username, email, contact, password, confirmPassword } = userData;
        
        if (password !== confirmPassword) {
            throw new AppError("Passwords don't match", StatusCodes.BAD_REQUEST)
        }

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            if (existingUser.isVerified) {
                throw new AppError('Email already registered',StatusCodes.BAD_REQUEST)
            }
            if (existingUser.verificationExpires < new Date()) {
                await this.userRepository.deleteById(existingUser._id)
            } else {
                const otp = generateOTP();
                const otpRecord = new OTP({
                    email,
                    otp,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 1 * 60 * 1000),
                });
                await this.otpRepository.save(otpRecord);
                try {
                    await this.mailService.sendOTP(email, otp);
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
        const existingUsername = await this.userRepository.findByUsername(username);
        
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

        const savedUser = await this.userRepository.save(newUser);

        try {
            await this.walletRepository.create(new Types.ObjectId(savedUser._id));
        } catch (error) {
            await this.userRepository.deleteById(savedUser._id);
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
        await this.otpRepository.save(otpRecord)
        try {
            await this.mailService.sendOTP(email,otp)
        } catch (error) {
            await this.otpRepository.deleteByEmail(email);
            throw new AppError('Failed to send OTP email', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }
}