import { setCookie } from "@/utils/cookie.util";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

interface DecodedJwt {
    userId: string;
    role: string;
    iat: number;
    exp?: number;
}

export const authMiddleware = (
    req: Request, 
    res: Response, 
    next: NextFunction
): void => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized', success: false });
        return;
    }

    try {
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string) as DecodedJwt;
        req.userId = decodedAccessToken.userId;
        next();
        return;
    } catch (accessTokenError) {
          console.error('Access token verification failed:', accessTokenError);
        if (!refreshToken) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized', success: false });
            return;
        }

        try {
            const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as DecodedJwt;

            const newAccessToken = jwt.sign(
                {
                    userId: decodedRefreshToken.userId,
                    role: decodedRefreshToken.role
                }, 
                process.env.JWT_ACCESS_SECRET as string, 
                { expiresIn: process.env.ACCESS_EXPIRES_IN }
            );

            setCookie(res, "accessToken",newAccessToken)


            req.userId = decodedRefreshToken.userId;
            next();
            return;
        } catch (refreshTokenError) {
            console.error('Refresh token verification failed:', refreshTokenError);
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Unauthorized', success: false });
            return;
        }
    }
};