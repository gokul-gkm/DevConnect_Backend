import { ISetNewTokenUseCase } from '@/application/useCases/interfaces/user/auth/ISetNewTokenUseCase';
import jwt from 'jsonwebtoken'

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
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as DecodedJwt;
            
            if (decoded && decoded.userId) {
                const newAccessToken = jwt.sign(
                    { userId: decoded.userId, role: decoded.role },
                    process.env.JWT_ACCESS_SECRET as string,
                    { expiresIn: "24h" }
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
        } catch (error) {
            return {
                success: false,
                message: "Invalid or expired token"
            };
        }
    }
}