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
  contentForRecipient?: string;
  contentForSender?: string;
  audioForRecipient?: Blob;
  audioForSender?: Blob;
  mediaUrl?: string;
  createdAt: string;
  encryptedSymetricKeyForRecipient?: string;
  encryptedSymetricKeyForSender?: string;
  contentForGroup?: string;
  sender?:User
  audioForGroup?:Blob
};

export type User = {
  userId: string;
  username: string;
};
