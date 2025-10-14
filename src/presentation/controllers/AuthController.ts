import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "@/domain/errors/AppError";
import { HTTP_STATUS_MESSAGES } from "@/utils/constants";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

import { IRegisterUserUseCase } from "@/application/useCases/interfaces/user/auth/IRegisterUserUseCase";
import { IVerifyOTPUseCase } from "@/application/useCases/interfaces/user/auth/IVerifyOTPUseCase";
import { IResendOTPUseCase } from "@/application/useCases/interfaces/user/auth/IResendOTPUseCase";
import { ILoginUserUseCase } from "@/application/useCases/interfaces/user/auth/ILoginUserUseCase";
import { IForgotPasswordUseCase } from "@/application/useCases/interfaces/user/auth/IForgotPasswordUseCase";
import { IResetPasswordUseCase } from "@/application/useCases/interfaces/user/auth/IResetPasswordUseCase";
import { ISetNewTokenUseCase } from "@/application/useCases/interfaces/user/auth/ISetNewTokenUseCase";


const ACCESS_COOKIE_MAX_AGE = Number(process.env.ACCESS_COOKIE_MAX_AGE);
const REFRESH_COOKIE_MAX_AGE = Number(process.env.REFRESH_COOKIE_MAX_AGE);

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.IRegisterUserUseCase)
    private _registerUserUseCase: IRegisterUserUseCase,
    @inject(TYPES.IVerifyOTPUseCase)
    private _verifyOTPUseCase: IVerifyOTPUseCase,
    @inject(TYPES.IResendOTPUseCase)
    private _resendOTPUseCase: IResendOTPUseCase,
    @inject(TYPES.ILoginUserUseCase)
    private _loginUserUseCase: ILoginUserUseCase,
    @inject(TYPES.IForgotPasswordUseCase)
    private _forgotPasswordUseCase: IForgotPasswordUseCase,
    @inject(TYPES.IResetPasswordUseCase)
    private _resetPasswordUseCase: IResetPasswordUseCase,
    @inject(TYPES.ISetNewTokenUseCase)
    private _setNewTokenUseCase: ISetNewTokenUseCase
  ) {}

  async register(req: Request, res: Response) {
    try {
      const userData = req.body;
      await this._registerUserUseCase.execute(userData);
      return res
        .status(StatusCodes.CREATED)
        .json({ message: "User registered and OTP send", success: true });
    } catch (error) {
      if (error instanceof AppError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, success: false });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
          error,
          success: false,
        });
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const isValidOTP = await this._verifyOTPUseCase.execute({ email, otp });
      if (!isValidOTP) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Invalid OTP" });
      }
      return res
        .status(StatusCodes.OK)
        .json({ message: "OTP Verified", success: true });
    } catch (error) {
      if (error instanceof AppError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, success: false });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
          success: false,
        });
    }
  }

  async resendOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await this._resendOTPUseCase.execute(email);
      return res
        .status(StatusCodes.OK)
        .json({ message: "New OTP send successfully.", success: true });
    } catch (error) {
      if (error instanceof AppError) {
        if (error.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
          return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
            message: error.message,
            retryAfter: "60",
          });
        }
        return res
          .status(error.statusCode)
          .json({ message: error.message, success: false });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
          success: false,
        });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } =
        await this._loginUserUseCase.execute({ email, password });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: REFRESH_COOKIE_MAX_AGE,
      });
      return res
        .status(StatusCodes.OK)
        .json({
          message: "Login successful",
          user,
          success: true,
          token: accessToken,
        });
    } catch (error) {
      if (error instanceof AppError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, success: false });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
          success: false,
        });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      res.clearCookie("accessToken", { httpOnly: true });
      res.clearCookie("refreshToken", { httpOnly: true });

      return res
        .status(StatusCodes.OK)
        .json({ message: "Logout successfully" });
    } catch (error) {
      console.error("Logout error: ", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const resetToken = await this._forgotPasswordUseCase.execute(email);
      return res
        .status(StatusCodes.OK)
        .json({
          message: "Password reset link has been sent to your email",
          resetToken,
          success: true,
        });
    } catch (error) {
      if (error instanceof AppError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, success: false });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
          success: false,
        });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      await this._resetPasswordUseCase.execute({ token, newPassword });
      return res
        .status(StatusCodes.OK)
        .json({
          message: "Password has been reset successfully",
          success: true,
        });
    } catch (error) {
      if (error instanceof AppError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, success: false });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
          success: false,
        });
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

      const response = await this._setNewTokenUseCase.execute(token);

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
        return res
          .status(error.statusCode)
          .json({ message: error.message, success: false });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
          success: false,
        });
    }
  }
}
