import { ISetNewTokenUseCase } from '@/application/useCases/interfaces/user/auth/ISetNewTokenUseCase';
import jwt from 'jsonwebtoken'
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  accessSignOptions,
} from "@/infrastructure/config/jwt";

interface DecodedJwt {
    userId: string;
    role: string;
  iat: number;
  exp?: number;
}

export class SetNewTokenUseCase implements ISetNewTokenUseCase {

    constructor() {
    }
    async execute(token : string){
        try {
            const decoded = jwt.verify(token, JWT_REFRESH_SECRET ) as DecodedJwt;
            
            if (decoded && decoded.userId) {

                const newAccessToken = jwt.sign(
                    { userId: decoded.userId, role: decoded.role },
                    JWT_ACCESS_SECRET,
                    accessSignOptions
                );
                
                return {
                    success: true,
                    message: "new token created",
                    token: newAccessToken,
                };
            }
            
            return {
                success: false,
                message: "Invalid token payload"
            };
        } catch (_error) {
            return {
                success: false,
                message: "Invalid or expired token"
            };
        }
    }
}