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
  content?: ArrayBuffer;
  text?: string;
  audio?: Blob;
  image?: Blob;
  createdAt: string;
  sender?: User;
  isDeleted: boolean;
  mediaPath?:string
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


export enum SocketEvents {
  IS_ONLINE = "isOnline",
  IS_TYPING = "isTyping",
  IS_NOT_TYPING = "isNotTyping",
  SEND_PRIVATE_MESSAGE = "sendPrivateMessage",
  JOIN_GROUP = "joinGroup",
  LEAVE_GROUP = "leaveGroup",
  SEND_GROUP_MESSAGE = "sendMessageForGroup",
  DELETE_MESSAGE = "deleteMessage",
  EXIT_GROUP = "exitGroup",
  UPDATE_GROUP_DETAILS = "updateGroupDetails",
  CONNECTION = 'connection',
  IS_CONNECTED = 'isConnected',
  IS_DISCONNECTED = 'isDisconnected',
  UN_AUTHORIZED = 'unauthorized',
  DISCONNECT='disconnect',
  GROUP_CREATED = "groupCreated",
}
