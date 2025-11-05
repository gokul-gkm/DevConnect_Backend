import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/types/types";
import { StatusCodes } from "http-status-codes";
import { AppError } from "@/domain/errors/AppError";
import { IGoogleLoginUseCase } from "@/application/useCases/interfaces/googleAuth/IGoogleLoginUseCase";
import { handleControllerError } from "../error/handleControllerError";
import { setCookie } from "@/utils/cookie.util";

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

            setCookie(res, "accessToken",accessToken)
            setCookie(res, "refreshToken", refreshToken)

            return res.status(StatusCodes.OK).json({
                message: "Google login successful",
                user,
                success: true,
                token: accessToken,
            });
        } catch (error: unknown) {
            console.error("Google login error: ", error);
            if (error instanceof AppError) {
                return res
                    .status(error.statusCode)
                    .json({ message: error.message, success: false });
            }

            handleControllerError(error, res, "Google Login Error");
        }
    }
}
