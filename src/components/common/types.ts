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
  contentForRecipient: string;
  contentForSender: string;
  mediaUrl: string;
  createdAt: string;
  encryptedSymetricKeyForRecipient: string;
  encryptedSymetricKeyForSender: string;
};

export type User = {
  userId: string;
  username: string;
};
