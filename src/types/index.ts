export enum UserStatusEnum {
  ONLINE = "online",
  OFFLINE = "offline",
  TYPING = "typing",
}

export type MsgStatus = {
  userId: string;
  isRead: boolean;
};

export type MessageType = {
  messageId: string;
  chatId: string;
  senderId: string;
  contentType: ContentType;
  content?: string;
  text?: string;
  audio?: Blob;
  image?: Blob;
  createdAt: string;
  sender?: User;
  isDeleted: boolean;
  mediaPath?: string;
  status: MsgStatus[];
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
  MEDIA_CACHE_DB = "mediaCacheDB",
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
  CONNECTION = "connection",
  IS_CONNECTED = "isConnected",
  IS_DISCONNECTED = "isDisconnected",
  UN_AUTHORIZED = "unauthorized",
  DISCONNECT = "disconnect",
  GROUP_CREATED = "groupCreated",
  KICK_MEMBER = "kickMember",
  ADD_NEW_MEMBER_TO_GROUP = "addNewMemberToGroup",
  READ_MESSAGE = "readMessage",
  SET_ADMIN = "setAdmin",
  ERROR = "error",
}

interface Participant {
  userId: string;
  username: string;
  publicKey: string;
}

interface Group {
  groupId: string;
  name: string;
  description: string;
}

export interface Chat {
  chatId: string;
  createdAt: string;
  isGroup: boolean;
  message: MessageType;
  recipient: Participant;
  group: Group;
  encryptedKey: string;
}

export interface GroupDetails {
  groupId: string;
  chatId: string;
  name: string;
  description: string;
  createdAt: string;
  chat: {
    participants: Omit<Participant, "publicKey">[];
    encryptedKey: string;
  };
  admins: string[];
}
