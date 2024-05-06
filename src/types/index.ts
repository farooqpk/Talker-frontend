export enum UserStatusEnum {
  ONLINE = "online",
  OFFLINE = "offline",
  TYPING = "typing",
}

export type MessageType = {
  messageId: string;
  chatId: string;
  senderId: string;
  contentType: string;
  content: string;
  audio?: Blob;
  image?: Blob;
  createdAt: string;
  sender?: User;
  isDeleted: boolean;
};

export type User = {
  userId: string;
  username: string;
};

export type ContentType = "TEXT" | "AUDIO" | "IMAGE";
