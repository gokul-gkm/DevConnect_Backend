import { LoginUserDTO } from "@/application/dto/LoginUserDTO";
import { IDevLoginUseCase } from "@/application/useCases/interfaces/developer/auth/IDevLoginUseCase";
import { IUser } from "@/domain/entities/User";
import { AppError } from "@/domain/errors/AppError";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import bcrypt from 'bcryptjs'
import { StatusCodes } from "http-status-codes";
import jwt from 'jsonwebtoken'

export class DevLoginUseCase implements IDevLoginUseCase{
    constructor(
        private _userRepository: IUserRepository,
        private _developerRepository: IDeveloperRepository
    ) {
        
    }

    async execute(loginData: LoginUserDTO): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUser, "password">}> {
        const { email, password } = loginData;

        const user = await this._userRepository.findByEmail(email);
        
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

        const developer = await this._developerRepository.findByUserId(user._id);
        if (!developer) {
            throw new AppError('Developer profile not found. Please register as a developer first.', StatusCodes.BAD_REQUEST);
        }

        switch (developer.status) {
            case 'pending':
                throw new AppError('Your developer application is still pending approval.', StatusCodes.BAD_REQUEST);
            case 'rejected':
                throw new AppError(
                    `Your developer application was rejected. ${developer.rejectionReason ? 
                    `Reason: ${developer.rejectionReason}` : 
                    'Please contact support for more information.'}`, 
                    StatusCodes.BAD_REQUEST
                );
            case 'approved':
                break;
            default:
                throw new AppError('Invalid developer status', StatusCodes.BAD_REQUEST);
        }

        const accessToken = jwt.sign(
            { userId: user._id, role: 'developer', developerId: developer._id },
            process.env.JWT_ACCESS_SECRET as string,
            {expiresIn : "24h"}
        );
        const refreshToken = jwt.sign(
            {
                userId: user._id,
                role: 'developer',
                developerId: developer._id
            },
            process.env.JWT_REFRESH_SECRET as string,
            {expiresIn: '7d'}
        )
        
        console.log(jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string));
        return { accessToken, refreshToken, user }
    }
}