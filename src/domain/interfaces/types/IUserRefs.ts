export interface IUserRef {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface IPopulatedChat {
  _id: string;
  userId: IUserRef;
  developerId: IUserRef;
  lastMessage?: string;
  lastMessageTime?: Date;
  userUnreadCount: number;
  developerUnreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}