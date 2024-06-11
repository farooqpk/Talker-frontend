export enum UserStatusEnum {
  ONLINE = "online",
  OFFLINE = "offline",
  TYPING = "typing",
}

export type MessageType = {
  messageId: string;
  chatId: string;
  senderId: string;
  contentType: ContentType;
  content: ArrayBuffer;
  text?: string;
  audio?: Blob;
  image?: Blob;
  createdAt: string;
  sender?: User;
  isDeleted: boolean;
};

export type User = {
  userId: string;
  username: string;
  publicKey: string;
};

// export type ContentType = "TEXT" | "AUDIO" | "IMAGE";
export enum ContentType {
  TEXT = "TEXT",
  AUDIO = "AUDIO",
  IMAGE = "IMAGE",
}

export type Option = {
  label: string;
  value: string;
};

export enum StoreNameIDB {
  PRIVATE_KEY_DB = "privateKeyDB",
}
