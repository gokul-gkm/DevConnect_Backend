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

export class AuthController {
    private registerUserUseCase: RegisterUserUseCase;
    private verifyOTPUseCase: VerifyOTPUseCase;
    private resendOTPUseCase: ResendOTPUseCase;
    private loginUserUseCase: LoginUserUseCase;
    private forgotPasswordUseCase: ForgotPasswordUseCase;
    private resetPasswordUseCase: ResetPasswordUseCase;

    constructor(
        private userRepository: UserRepository,
        private otpRepository: OTPRepository,
        private mailService: MailService,
    ) {
        this.registerUserUseCase = new RegisterUserUseCase(userRepository,otpRepository, mailService);
        this.verifyOTPUseCase = new VerifyOTPUseCase(otpRepository, userRepository);
        this.resendOTPUseCase = new ResendOTPUseCase(otpRepository, mailService, userRepository);
        this.loginUserUseCase = new LoginUserUseCase(userRepository);
        this.forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, mailService);
        this.resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
    }

    async register(req: Request, res: Response) {
        try {
            const userData = req.body;
            await this.registerUserUseCase.execute(userData)
            return res.status(201).json({ message: 'User registered and OTP send' });
            
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error', error });
        }
    }

    async verifyOTP(req: Request , res: Response) {
        try {
            const { email, otp } = req.body;
            const isValidOTP = await this.verifyOTPUseCase.execute({ email, otp });
            if (!isValidOTP) {
                return res.status(400).json({ message: 'Invalid OTP' });
            }
            return res.status(200).json({message: 'OTP Verified'})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(500).json({message: "Internal Server Error"})
        }
    }

    async resendOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await this.resendOTPUseCase.execute(email);
            return res.status(200).json({message: "New OTP send successfully."})
        } catch (error) {
            if (error instanceof AppError) {
                if (error.statusCode === 429) {
                    return res.status(429).json({
                        message: error.message,
                        retryAfter: '60'
                    })
                }
                return res.status(error.statusCode).json({message: error.message})
            }
            return res.status(500).json({message: 'Internal server error'})
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            
            const { accessToken, refreshToken, user } = await this.loginUserUseCase.execute({ email, password });
           
            res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.status(200).json({message: "Login successful", user})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({message: error.message})
            }
            return res.status(500).json('Internal server error')
        }
    }

    async logout(req: Request, res: Response) {
        try {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(200).json({ message: 'Logout successfully' });
        } catch (error) {
            console.error('Logout error: ', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const resetToken = await this.forgotPasswordUseCase.execute(email);
            return res.status(200).json({"message": 'Password reset link has been sent to your email', resetToken})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({message: error.message})
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;
            await this.resetPasswordUseCase.execute({ token, newPassword });
            return res.status(200).json({message: "Password has been reset successfully"})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({message: error.message})
            }
            return res.status(500).json('Internal server error')
        }
    }
}
