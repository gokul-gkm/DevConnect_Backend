import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

const ACCESS_COOKIE_MAX_AGE = Number(process.env.ACCESS_COOKIE_MAX_AGE);

interface DecodedJwt {
    adminId: string;
    iat: number;
    exp?: number;
}

export const adminAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => { 
    const adminAccessToken = req.cookies.adminAccessToken;
    const adminRefreshToken = req.cookies.adminRefreshToken;

    if (!adminAccessToken && !adminRefreshToken) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized', success: false });
        return
    }
    try {
        const decodedAccessToken = jwt.verify(adminAccessToken, process.env.JWT_ADMIN_ACCESS_SECRET as string) as DecodedJwt;
        req.adminId = decodedAccessToken.adminId;
        return next();
    } catch (accessTokenError) {
        if (!adminRefreshToken) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized', success: false });
            return
        }
        try {
            const decodedRefreshToken = jwt.verify(adminRefreshToken, process.env.JWT_ADMIN_REFRESH_SECRET as string) as DecodedJwt;

            const newAdminAccessToken = jwt.sign({ adminId: decodedRefreshToken.adminId }, process.env.JWT_ADMIN_ACCESS_SECRET as string, { expiresIn: process.env.ACCESS_EXPIRES_IN });

            res.cookie('adminAccessToken', newAdminAccessToken, {
                httpOnly: true,
                maxAge: ACCESS_COOKIE_MAX_AGE
            });

            req.adminId = decodedRefreshToken.adminId;
            next();
            return;
        } catch (refreshTokenError) {
            res.clearCookie('adminAccessToken');
            res.clearCookie('adminRefreshToken');
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Unauthorized', success: false });  
            return;
        }
    }
}