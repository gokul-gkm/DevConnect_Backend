import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/repositories/IChatRepository";
import { StatusCodes } from "http-status-codes";
import { IGetUserChatsUseCase } from "../../interfaces/chat/IGetUserChatsUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IUserRef } from "@/domain/interfaces/types/IUserRefs";

@injectable()
export class GetUserChatsUseCase implements IGetUserChatsUseCase {
  constructor(
    @inject(TYPES.IChatRepository)
    private _chatRepository: IChatRepository,
    @inject(TYPES.IS3Service)
    private _s3Service: IS3Service
  ) {}

  async execute(userId: string) {
    try {
      const chats = await this._chatRepository.getUserChats(userId);
      const transformedChats = await Promise.all(
        chats.map(async (chat) => {
      const developerPic = (chat.developerId as IUserRef).profilePicture;
      const userPic = (chat.userId as IUserRef).profilePicture;

      const devUrl = developerPic ? await this._s3Service.generateSignedUrl(developerPic) : null;
      const userUrl = userPic ? await this._s3Service.generateSignedUrl(userPic) : null;

          return {
            _id: chat._id?.toString(),
            userId: {
              _id: chat.userId._id?.toString(),
              username: chat.userId.username,
              profilePicture: userUrl,
            },
            developerId: {
              _id: chat.developerId._id?.toString(),
              username: chat.developerId.username,
              profilePicture: devUrl,
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
    } catch (_error) {
      throw new AppError(
        "Failed to get user chats",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}
