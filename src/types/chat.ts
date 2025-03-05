import { Types } from 'mongoose';

interface IDeveloper {
    _id: Types.ObjectId;
    username: string;
    profilePicture?: string;
}
interface IUser {
    _id: Types.ObjectId;
    username: string;
    profilePicture?: string;
}

export interface IChats {
    _id: Types.ObjectId;
    userId: IUser;
    developerId: IDeveloper;
    lastMessage?: string;
    userUnreadCount: number;
    developerUnreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}