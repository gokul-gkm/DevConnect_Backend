import { LoginUserDTO } from "@/application/dto/LoginUserDTO";
import { IUser } from "@/domain/entities/User";
import { AppError } from "@/domain/errors/AppError";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import bcrypt from 'bcryptjs'
import { StatusCodes } from "http-status-codes";
import jwt from 'jsonwebtoken'

export class LoginUserUseCase{
    constructor(private userRepository: UserRepository) {}

    async execute(loginData: LoginUserDTO): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUser, "password">}> {
        try {
            const { email, password } = loginData;

        const user = await this.userRepository.findByEmail(email);
        
        if (!user) {
            throw new AppError('Invalid credentials', StatusCodes.BAD_REQUEST)
        }
        if (user.status === 'blocked') {
            throw new AppError('User account is blocked',StatusCodes.BAD_REQUEST);
        }
        if (user.status === 'suspended') {
            throw new AppError("User account is already suspended")
        }

        const isPasswordValid = await bcrypt.compare(password, user.password as string);
        
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials')
        }
        const accessToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_ACCESS_SECRET as string,
            {expiresIn : "24h"}
        );
        const refreshToken = jwt.sign(
            { userId: user._id, role: 'user' },
            process.env.JWT_REFRESH_SECRET as string,
            {expiresIn: '7d'}
        )
        
        console.log(jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string));
        return { accessToken, refreshToken, user }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to Login', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}