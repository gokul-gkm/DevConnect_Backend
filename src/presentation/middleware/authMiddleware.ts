import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedJwt {
    userId: string;
    iat: number;
    exp?: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => { 
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if(!accessToken && !refreshToken) {
        return res.status(401).json({ message: 'Unauthorized', success: false });
    }

    try {
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string) as DecodedJwt;
        req.userId = decodedAccessToken.userId;
        return next();
    } catch (accessTokenError) {
        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized', success: false });
        }

        try {
            const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as DecodedJwt;

            const newAccessToken = jwt.sign({ userId: decodedRefreshToken.userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                maxAge: 15 * 60 * 1000
            });

            req.userId = decodedRefreshToken.userId;
            return next();
        } catch (refreshTokenError) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(403).json({ message: 'Unauthorized', success: false });    
        }
    }
}