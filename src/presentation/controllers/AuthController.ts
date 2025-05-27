import { Request, Response } from "express";
import { RegisterUserUseCase } from "@/application/useCases/user/auth/RegisterUserUseCase";
import { VerifyOTPUseCase } from "@/application/useCases/user/auth/VerifyOTPUseCase";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { MailService } from "@/infrastructure/mail/MailService";
import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";
import { AppError } from "@/domain/errors/AppError";
import { ResendOTPUseCase } from "@/application/useCases/user/auth/ResendOTPUseCase";
import { LoginUserUseCase } from "@/application/useCases/user/auth/LoginUserUseCase";
import { ForgotPasswordUseCase } from "@/application/useCases/user/auth/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "@/application/useCases/user/auth/ResetPasswordUseCase";
import { StatusCodes } from "http-status-codes";
import { WalletRepository } from "@/infrastructure/repositories/WalletRepository";
import { SetNewTokenUseCase } from "@/application/useCases/user/auth/SetNewTokenUseCase";
import { HTTP_STATUS_MESSAGES } from "@/utils/constants";

export class AuthController {
    private registerUserUseCase: RegisterUserUseCase;
    private verifyOTPUseCase: VerifyOTPUseCase;
    private resendOTPUseCase: ResendOTPUseCase;
    private loginUserUseCase: LoginUserUseCase;
    private forgotPasswordUseCase: ForgotPasswordUseCase;
    private resetPasswordUseCase: ResetPasswordUseCase;
    private setNewTokenUseCase: SetNewTokenUseCase;

    constructor(
        private userRepository: UserRepository,
        private otpRepository: OTPRepository,
        private mailService: MailService,
        private walletRepository: WalletRepository,
    ) {
        this.registerUserUseCase = new RegisterUserUseCase(userRepository,otpRepository, mailService, walletRepository);
        this.verifyOTPUseCase = new VerifyOTPUseCase(otpRepository, userRepository);
        this.resendOTPUseCase = new ResendOTPUseCase(otpRepository, mailService, userRepository);
        this.loginUserUseCase = new LoginUserUseCase(userRepository);
        this.forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, mailService);
        this.resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
        this.setNewTokenUseCase = new SetNewTokenUseCase();
    }

    async register(req: Request, res: Response) {
        try {
            const userData = req.body;
            await this.registerUserUseCase.execute(userData)
            return res.status(StatusCodes.CREATED).json({ message: 'User registered and OTP send' , success: true});
            
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message , success: false});
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, error , success: false});
        }
    }

    async verifyOTP(req: Request , res: Response) {
        try {
            const { email, otp } = req.body;
            const isValidOTP = await this.verifyOTPUseCase.execute({ email, otp });
            if (!isValidOTP) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid OTP' });
            }
            return res.status(StatusCodes.OK).json({message: 'OTP Verified', success: true})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message , success: false});
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false})
        }
    }

    async resendOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await this.resendOTPUseCase.execute(email);
            return res.status(StatusCodes.OK).json({message: "New OTP send successfully.", success: true})
        } catch (error) {
            if (error instanceof AppError) {
                if (error.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
                    return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
                        message: error.message,
                        retryAfter: '60'
                    })
                }
                return res.status(error.statusCode).json({message: error.message, success: false})
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false})
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;           
            const { accessToken, refreshToken, user } = await this.loginUserUseCase.execute({ email, password });
           
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

    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const resetToken = await this.forgotPasswordUseCase.execute(email);
            return res.status(StatusCodes.OK).json({ "message": 'Password reset link has been sent to your email', resetToken, success: true });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({message: error.message, success: false})
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false });
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;
            await this.resetPasswordUseCase.execute({ token, newPassword });
            return res.status(StatusCodes.OK).json({message: "Password has been reset successfully", success: true})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false})
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false });
        }
    }

    async setNewToken(req: Request, res: Response) {
        try {
            const token = req.cookies?.refreshToken;

            if (!token) {
              return res
                .status(StatusCodes.FORBIDDEN)
                .json({ message: "No refresh token found" });
            }
      
            const response = await this.setNewTokenUseCase.execute(token);
      
            if (response?.success) {
              return res.status(StatusCodes.OK).json({ token: response.token });
            } else {
              res.clearCookie("refreshToken");
              return res
                .status(StatusCodes.FORBIDDEN)
                .json({ message: response?.message });
            }
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false})
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false });
        }
    }

    
}
