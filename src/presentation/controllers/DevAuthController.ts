import { HTTP_STATUS_MESSAGES } from "@/utils/constants";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "@/domain/errors/AppError";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

import { IRegisterDevUseCase } from "@/application/useCases/interfaces/developer/auth/IRegisterDevUseCase";
import { IVerifyOTPUseCase } from "@/application/useCases/interfaces/user/auth/IVerifyOTPUseCase";
import { IResendOTPUseCase } from "@/application/useCases/interfaces/user/auth/IResendOTPUseCase";
import { IDevRequestUseCase } from "@/application/useCases/interfaces/developer/auth/IDevRequestUseCase";
import { IDevLoginUseCase } from "@/application/useCases/interfaces/developer/auth/IDevLoginUseCase";
import { handleControllerError } from "../error/handleControllerError";


const ACCESS_COOKIE_MAX_AGE = Number(process.env.ACCESS_COOKIE_MAX_AGE);
const REFRESH_COOKIE_MAX_AGE = Number(process.env.REFRESH_COOKIE_MAX_AGE);

@injectable()
export class DevAuthController {

    constructor(
        @inject(TYPES.IRegisterDevUseCase)
        private _registerDevUseCase: IRegisterDevUseCase,
        @inject(TYPES.IVerifyOTPUseCase)
        private _verifyOTPUseCase: IVerifyOTPUseCase,
        @inject(TYPES.IResendOTPUseCase)
        private _resendOTPUseCase: IResendOTPUseCase,
        @inject(TYPES.IDevRequestUseCase)
        private _devRequestUseCase: IDevRequestUseCase,
        @inject(TYPES.IDevLoginUseCase)
        private _devLoginUseCase: IDevLoginUseCase,
    ) {}

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
        } catch (error: unknown) {
            console.error(error);
            handleControllerError(error, res, HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR);
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;            
            const { accessToken, refreshToken, user } = await this._devLoginUseCase.execute({ email, password });
           
            res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: ACCESS_COOKIE_MAX_AGE });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: REFRESH_COOKIE_MAX_AGE });
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