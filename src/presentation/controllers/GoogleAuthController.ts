import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/types/types";
import { StatusCodes } from "http-status-codes";
import { AppError } from "@/domain/errors/AppError";
import { IGoogleLoginUseCase } from "@/application/useCases/interfaces/googleAuth/IGoogleLoginUseCase";

const ACCESS_COOKIE_MAX_AGE = Number(process.env.ACCESS_COOKIE_MAX_AGE);
const REFRESH_COOKIE_MAX_AGE = Number(process.env.REFRESH_COOKIE_MAX_AGE);

@injectable()
export class GoogleAuthController {
    constructor(
        @inject(TYPES.IGoogleLoginUseCase)
        private _googleLoginUseCase: IGoogleLoginUseCase
    ) {}

    async googleLogin(req: Request, res: Response) {
        try {
            const { token } = req.body;
            const { user, accessToken, refreshToken } = await this._googleLoginUseCase.execute(token);

            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                maxAge: ACCESS_COOKIE_MAX_AGE,
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                maxAge: REFRESH_COOKIE_MAX_AGE,
            });

            return res.status(StatusCodes.OK).json({
                message: "Google login successful",
                user,
                success: true,
                token: accessToken,
            });
        } catch (error: any) {
            console.error("Google login error: ", error);
            if (error instanceof AppError) {
                return res
                    .status(error.statusCode)
                    .json({ message: error.message, success: false });
            }

            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.message || "Google Login Error",
                success: false,
            });
        }
    }
}
