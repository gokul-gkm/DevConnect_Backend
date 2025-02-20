import { DevLoginUseCase } from "@/application/useCases/developer/auth/DevLoginUseCase";
import { DevRequestUseCase } from "@/application/useCases/developer/auth/DevRequestUseCase";
import { RegisterDevUseCase } from "@/application/useCases/developer/auth/RegisterDevUseCase";
import { ResendOTPUseCase } from "@/application/useCases/user/auth/ResendOTPUseCase";
import { VerifyOTPUseCase } from "@/application/useCases/user/auth/VerifyOTPUseCase";
import { AppError } from "@/domain/errors/AppError";
import { MailService } from "@/infrastructure/mail/MailService";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export class DevAuthController {
    private registerDevUseCase: RegisterDevUseCase;
    private verifyOTPUseCase: VerifyOTPUseCase;
    private resendOTPUseCase: ResendOTPUseCase;
    private devRequestUseCase: DevRequestUseCase;
    private devLoginUseCase: DevLoginUseCase;
    constructor(
        private userRepository: UserRepository,
        private otpRepository: OTPRepository,
        private devRepository: DeveloperRepository,
        private mailService: MailService,
        private s3Service: S3Service,
    ) {
        this.registerDevUseCase = new RegisterDevUseCase(userRepository, otpRepository, mailService);
        this.verifyOTPUseCase = new VerifyOTPUseCase(otpRepository, userRepository);
        this.resendOTPUseCase = new ResendOTPUseCase(otpRepository, mailService, userRepository);
        this.devRequestUseCase = new DevRequestUseCase(userRepository, devRepository, s3Service)
        this.devLoginUseCase = new DevLoginUseCase(userRepository,devRepository)
    }
    async register(req: Request, res: Response) {
        try {
            const devData = req.body;
            await this.registerDevUseCase.execute(devData);
            return res.status(StatusCodes.CREATED).json({ message: "Developer registered and OTP send", success: true })
            
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: true })
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', error, success: false })
        }
    }
    async verifyOTP(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;
            const isValidOTP = await this.verifyOTPUseCase.execute({ email, otp });
            if (!isValidOTP) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid OTP' });
            }
            return res.status(StatusCodes.OK).json({ message: 'OTP Verified', success: true })
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error", success: false })
        }
    }

    async resendOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await this.resendOTPUseCase.execute(email);
            return res.status(StatusCodes.OK).json({ message: "New OTP send successfully.", success: true })
        } catch (error) {
            if (error instanceof AppError) {
                if (error.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
                    return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
                        message: error.message,
                        retryAfter: '60'
                    })
                }
                return res.status(error.statusCode).json({ message: error.message, success: false })
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', success: false })
        }
    }

    async devRequest(req: Request, res: Response) {
        try {
           
            const formData = req.body
            const files = req.files as {
                profilePicture?: Express.Multer.File[],
                resume?: Express.Multer.File[]
            };
            if (!formData.email || !formData.username) {
                throw new AppError('Missing required fields', StatusCodes.BAD_REQUEST);
            }
                    
            await this.devRequestUseCase.execute(formData, files);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Developer request submitted successfully. Please wait for admin confirmation'
            });
        } catch (error: any) {
            console.error(error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', success: false })
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;            
            const { accessToken, refreshToken, user } = await this.devLoginUseCase.execute({ email, password });
           
            res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.status(StatusCodes.OK).json({message: "Login successful", user, success: true})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({message: error.message, success: false})
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: 'Internal server error', success: false})
        }
    }


}