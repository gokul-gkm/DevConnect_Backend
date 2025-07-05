import { HTTP_STATUS_MESSAGES } from "@/utils/constants";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "@/domain/errors/AppError";

import { MailService } from "@/infrastructure/mail/MailService";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";

import { DevLoginUseCase } from "@/application/useCases/implements/developer/auth/DevLoginUseCase";
import { DevRequestUseCase } from "@/application/useCases/implements/developer/auth/DevRequestUseCase";
import { RegisterDevUseCase } from "@/application/useCases/implements/developer/auth/RegisterDevUseCase";
import { ResendOTPUseCase } from "@/application/useCases/implements/user/auth/ResendOTPUseCase";
import { VerifyOTPUseCase } from "@/application/useCases/implements/user/auth/VerifyOTPUseCase";

import { IRegisterDevUseCase } from "@/application/useCases/interfaces/developer/auth/IRegisterDevUseCase";
import { IVerifyOTPUseCase } from "@/application/useCases/interfaces/user/auth/IVerifyOTPUseCase";
import { IResendOTPUseCase } from "@/application/useCases/interfaces/user/auth/IResendOTPUseCase";
import { IDevRequestUseCase } from "@/application/useCases/interfaces/developer/auth/IDevRequestUseCase";
import { IDevLoginUseCase } from "@/application/useCases/interfaces/developer/auth/IDevLoginUseCase";

export class DevAuthController {
    private _registerDevUseCase: IRegisterDevUseCase;
    private _verifyOTPUseCase: IVerifyOTPUseCase;
    private _resendOTPUseCase: IResendOTPUseCase;
    private _devRequestUseCase: IDevRequestUseCase;
    private _devLoginUseCase: IDevLoginUseCase;
    constructor(
        private _userRepository: UserRepository,
        private _otpRepository: OTPRepository,
        private _devRepository: DeveloperRepository,
        private _mailService: MailService,
        private _s3Service: S3Service,
    ) {
        this._registerDevUseCase = new RegisterDevUseCase(_userRepository, _otpRepository, _mailService);
        this._verifyOTPUseCase = new VerifyOTPUseCase(_otpRepository, _userRepository);
        this._resendOTPUseCase = new ResendOTPUseCase(_otpRepository, _mailService, _userRepository);
        this._devRequestUseCase = new DevRequestUseCase(_userRepository, _devRepository, _s3Service)
        this._devLoginUseCase = new DevLoginUseCase(_userRepository,_devRepository)
    }
    async register(req: Request, res: Response) {
        try {
            const devData = req.body;
            await this._registerDevUseCase.execute(devData);
            return res.status(StatusCodes.CREATED).json({ message: "Developer registered and OTP send", success: true })
            
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: true })
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, error, success: false })
        }
    }
    async verifyOTP(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;
            const isValidOTP = await this._verifyOTPUseCase.execute({ email, otp });
            if (!isValidOTP) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid OTP' });
            }
            return res.status(StatusCodes.OK).json({ message: 'OTP Verified', success: true })
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false })
        }
    }

    async resendOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await this._resendOTPUseCase.execute(email);
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
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false })
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
                    
            await this._devRequestUseCase.execute(formData, files);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Developer request submitted successfully. Please wait for admin confirmation'
            });
        } catch (error: any) {
            console.error(error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false })
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;            
            const { accessToken, refreshToken, user } = await this._devLoginUseCase.execute({ email, password });
           
            res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.status(StatusCodes.OK).json({message: "Login successful", user, success: true, token: accessToken})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({message: error.message, success: false})
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false})
        }
    }
     
    async logout(req: Request, res: Response) {
        try {        
            res.clearCookie('accessToken',{httpOnly: true});
            res.clearCookie('refreshToken',{ httpOnly: true });
           
            return res.status(StatusCodes.OK).json({ message: 'Logout successfully' });
        } catch (error) {
            console.error('Logout error: ', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR });
        }
    }

}