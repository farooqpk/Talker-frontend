export enum UserStatusEnum {
  ONLINE = "online",
  OFFLINE = "offline",
  TYPING = "typing",
}

export type MessageType = {
  messageId?: string;
  chatId: string;
  senderId: string;
  contentType: string;
  content: string;
  audio?: Blob;
  createdAt: string;
  sender?:User
};

export type User = {
  userId: string;
  username: string;
};
