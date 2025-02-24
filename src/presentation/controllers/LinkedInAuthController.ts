import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { Request, Response } from "express";
import axios from "axios";
import { AppError } from "@/domain/errors/AppError";
import { User } from "@/domain/entities/User";
import jwt from 'jsonwebtoken';
import { StatusCodes } from "http-status-codes";

export class LinkedInAuthController {
    constructor(private userRepository: UserRepository) {}
    
    async linkedInLogin(req: Request, res: Response) {
        const { code } = req.body;

        try {
           
            const tokenResponse = await axios.post(
                'https://www.linkedin.com/oauth/v2/accessToken',
                null,
                {
                    params: {
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                        client_id: process.env.LINKEDIN_CLIENT_ID,
                        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const { access_token } = tokenResponse.data;
            

           
            const userInfoResponse = await axios.get(
                'https://api.linkedin.com/v2/userinfo',
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                    },
                }
            );

           

            const { 
                sub: linkedinId,
                email,
                given_name: firstName,
                family_name: lastName,
                picture: profilePicture
            } = userInfoResponse.data;

            
            let user = await this.userRepository.findByLinkedIn( linkedinId );
            
            if (!user) {
                
                user = await this.userRepository.findByEmail(email);
            }

            if (user?.status === 'blocked') {
                throw new AppError('User account is blocked', StatusCodes.BAD_REQUEST);
            }

            if (user) {
                
                if (!user.linkedinId) {
                    console.log("update linkedin id...");
                    user.linkedinId = linkedinId;
                    user = await this.userRepository.save(user);
                }
            } else {

               
                const newUser = new User({
                    email,
                    username: `${firstName} ${lastName}`,
                    linkedinId,
                    password: '',
                    contact: '0000000000',
                    profilePicture,
                    role: 'user',
                    isVerified: true,
                });
                user = await this.userRepository.save(newUser);
            }

            const accessToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_ACCESS_SECRET as string,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET as string,
                { expiresIn: '7d' }
            );

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(StatusCodes.OK).json({
                message: 'LinkedIn login successful',
                user,
                success: true,
            });
        } catch (error: any) {
            console.error('LinkedIn login error:', error.response?.data || error);
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    message: error.message,
                    success: false,
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.response?.data?.message || 'LinkedIn Login Error',
                success: false,
            });
        }
    }
}