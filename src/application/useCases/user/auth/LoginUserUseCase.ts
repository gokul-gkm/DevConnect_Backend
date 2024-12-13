import { LoginUserDTO } from "@/application/dto/LoginUserDTO";
import { IUser } from "@/domain/entities/User";
import { AppError } from "@/domain/errors/AppError";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export class LoginUserUseCase{
    constructor(private userRepository: UserRepository) {
        
    }

    async execute(loginData: LoginUserDTO): Promise<{ accessToken: string; refreshToken: string; user: IUser}> {
        const { email, password } = loginData;

        const user = await this.userRepository.findByEmail(email);
        
        if (!user) {
            throw new AppError('Invalid credentials', 400)
        }
        if (user.status === 'blocked') {
            throw new AppError('User account is blocked',400);
        }
        if (user.status === 'suspended') {
            throw new AppError("User account is already suspended")
        }

        const isPasswordValid = await bcrypt.compare(password, user.password as string);
        
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials')
        }
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_ACCESS_TOKEN as string,
            {expiresIn : "15m"}
        );
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_TOKEN as string,
            {expiresIn: '7d'}
        )
        

        console.log(jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN as string));
        return {accessToken,refreshToken,user}
    }
}