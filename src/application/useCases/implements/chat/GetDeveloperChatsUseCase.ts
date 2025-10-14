import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { StatusCodes } from "http-status-codes";
import { IGetDeveloperChatsUseCase } from "../../interfaces/chat/IGetDeveloperChatsUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IUserRef } from "@/domain/interfaces/IUserRefs";


@injectable()
export class GetDeveloperChatsUseCase implements IGetDeveloperChatsUseCase {
    constructor(
        @inject(TYPES.IChatRepository)
        private _chatRepository: IChatRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service
    ) { }
    
    async execute(developerId: string) {
        try {
            const chats = await this._chatRepository.getDeveloperChats(developerId);

            const transformedChats = await Promise.all(
                    chats.map(async (chat) => {
                      const profilePictureUrl = await this._s3Service.generateSignedUrl(
                        (chat.developerId as IUserRef).profilePicture!
                      );
            
                      const userProfilePictureUrl = await this._s3Service.generateSignedUrl(
                        (chat.userId as IUserRef).profilePicture!
                      );
            
                      return {
                        _id: chat._id?.toString(),
                        userId: {
                          _id: chat.userId._id?.toString(),
                          username: chat.userId.username,
                          profilePicture: userProfilePictureUrl,
                        },
                        developerId: {
                          _id: chat.developerId._id?.toString(),
                          username: chat.developerId.username,
                          profilePicture: profilePictureUrl,
                        },
                        lastMessage: chat.lastMessage,
                        userUnreadCount: chat.userUnreadCount,
                        developerUnreadCount: chat.developerUnreadCount,
                        lastMessageTime: chat.lastMessageTime,
                        createdAt: chat.createdAt,
                        updatedAt: chat.updatedAt,
                      };
                    })
                  );
            
            return transformedChats;
        } catch (error) {
            throw new AppError('Failed to get developer chats', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}