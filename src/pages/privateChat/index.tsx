import { ReactElement, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { findUserApi } from "@/services/api/user";
import { useSocket } from "@/context/socketProvider";
import { useEffect, useState } from "react";
import {
  ContentType,
  MessageType,
  SocketEvents,
  UserStatusEnum,
} from "@/types/index";
import {
  getChatKeyApi,
  getMediaApi,
  getMessagesApi,
  getSignedUrlApi,
  uploadToSignedUrlApi,
} from "@/services/api/chat";
import {
  createSymetricKey,
  decryptMessage,
  decryptSymetricKeyWithPrivateKey,
  encryptMessage,
  encryptSymetricKeyWithPublicKey,
} from "@/lib/ecrypt_decrypt";
import { useGetUser } from "@/hooks/useGetUser";
import msgRecieveSound from "../../assets/Pocket.mp3";
import msgSendSound from "../../assets/Solo.mp3";
import {
  addValueToMediaCacheIDB,
  clearOldestMediaCacheIDB,
  getValueFromMediaCacheIDB,
  getValueFromStoreIDB,
  sizeOfMediaCacheIDB,
} from "@/lib/idb";
import ChatContent from "@/components/chat/chatContent";
import ChatFooter from "@/components/chat/chatFooter";
import ChatHeader from "@/components/chat/chatHeader";
import Loader from "@/components/loader";
import {
  decode as base64ToArrayBuffer,
  encode as arrayBufferToBase64,
} from "base64-arraybuffer";
import msgpack from "msgpack-lite";

export default function PrivateChat(): ReactElement {
  const { id } = useParams();
  const socket = useSocket();
  const { user } = useGetUser();
  const [userStatus, setUserStatus] = useState<UserStatusEnum>(
    UserStatusEnum.OFFLINE
  );
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const encryptedChatKeyRef = useRef<ArrayBuffer | undefined>(undefined);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [getMediaLoading, setGetMediaLoading] = useState<{
    messageId: string;
    loading: boolean;
  }>({ messageId: "", loading: false });

  const { data: recipient, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const { isLoading: chatKeyLoading } = useQuery({
    queryKey: ["chatKeyquery", recipient?.chatId],
    enabled: !!recipient?.chatId,
    queryFn: () => getChatKeyApi(recipient?.chatId!),
    onSuccess: (encryptedKey: string) => {
      if (encryptedKey) {
        const encryptedKeyArrayBuffer = base64ToArrayBuffer(encryptedKey);
        encryptedChatKeyRef.current = encryptedKeyArrayBuffer;
      }
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesquery", recipient?.chatId],
    queryFn: () => getMessagesApi(recipient.chatId!),
    enabled: !!recipient?.chatId && !!encryptedChatKeyRef.current,
    onSuccess: async (data: MessageType[]) => {
      if (!data || !user) return;

      const privateKey = await getValueFromStoreIDB(user.userId);

      if (!privateKey) return;

      const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
        encryptedChatKeyRef.current!,
        privateKey
      );

      const decryptedData = await Promise.all(
        data?.map(async (message) => {
          if (message.isDeleted) return message;

          switch (message.contentType) {
            case ContentType.TEXT: {
              const textArrayBuffer = base64ToArrayBuffer(message?.content!);
              message.text = (await decryptMessage(
                textArrayBuffer,
                decryptedChatKey,
                ContentType.TEXT
              )) as string;

              break;
            }
            case ContentType.IMAGE: {
              const getMediaFromCache = await getValueFromMediaCacheIDB(
                message.mediaPath!
              );
              if (!getMediaFromCache) break;
              message.image = (await decryptMessage(
                getMediaFromCache,
                decryptedChatKey,
                ContentType.IMAGE
              )) as Blob;
              break;
            }
            case ContentType.AUDIO: {
              const getMediaFromCache = await getValueFromMediaCacheIDB(
                message.mediaPath!
              );
              if (!getMediaFromCache) break;
              message.audio = (await decryptMessage(
                getMediaFromCache,
                decryptedChatKey,
                ContentType.AUDIO
              )) as Blob;
              break;
            }
            default:
              break;
          }

          return message;
        })
      );
      setMessages(decryptedData);
    },
  });

  const handleTyping = (value: string) => {
    if (!socket) return;
    setTypedText(value);
    if (value.length > 0) {
      socket.emit(SocketEvents.IS_TYPING, msgpack.encode({ toUserId: id }));
    } else {
      socket.emit(SocketEvents.IS_NOT_TYPING, msgpack.encode({ toUserId: id }));
    }
  };

  const handleSendMessage = async (type: ContentType, blob?: Blob) => {
    if (!socket || !recipient || !user?.publicKey) return;

    const privateKey: CryptoKey = await getValueFromStoreIDB(user.userId);
    if (!privateKey) return;

    // for loading....
    setSendMessageLoading(true);

    const isChatAlreadyExist = recipient?.chatId;

    let encryptedChatKeyForUsers: Array<{
      userId: string;
      encryptedKey: ArrayBuffer;
    }> = [];

    let encryptedChatKeyForUsersBase64: Array<{
      userId: string;
      encryptedKey: string;
    }> = [];

    let ourOwnEncryptedChatKey: ArrayBuffer | undefined;

    if (!isChatAlreadyExist) {
      const chatKey = await createSymetricKey();

      const usersWithPublicKey = [
        { userId: user?.userId, publicKey: user?.publicKey },
        { userId: recipient?.userId, publicKey: recipient?.publicKey },
      ];

      await Promise.all(
        usersWithPublicKey.map(async (item) => {
          const encryptedKey = await encryptSymetricKeyWithPublicKey(
            chatKey,
            item.publicKey
          );

          encryptedChatKeyForUsers.push({
            userId: item.userId,
            encryptedKey,
          });

          // keeping this for sending to server as base64
          encryptedChatKeyForUsersBase64.push({
            userId: item.userId,
            encryptedKey: arrayBufferToBase64(encryptedKey),
          });
        })
      );

      ourOwnEncryptedChatKey = encryptedChatKeyForUsers.find(
        (item) => item.userId === user?.userId
      )?.encryptedKey!;

      encryptedChatKeyRef.current = ourOwnEncryptedChatKey;
    }

    const chatContent =
      type === ContentType.TEXT
        ? typedText
        : type === ContentType.IMAGE
        ? blob!
        : type === ContentType.AUDIO
        ? blob!
        : "";

    const chatKey = isChatAlreadyExist
      ? encryptedChatKeyRef.current
      : ourOwnEncryptedChatKey!;

    if (!chatKey) return;

    const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
      chatKey!,
      privateKey!
    );

    const encryptedMessage = await encryptMessage(
      chatContent,
      decryptedChatKey
    );

    let uploadedPath: string | null = null;

    if (type !== ContentType.TEXT) {
      const { url, uniqueKey } = await getSignedUrlApi({
        filesize: encryptedMessage.byteLength,
      });

      uploadedPath = uniqueKey;

      await uploadToSignedUrlApi({
        content: encryptedMessage,
        url,
      });
    }

    // convert message to base64 for sending to server
    const encryptedMessageBase64 =
      type === ContentType.TEXT ? arrayBufferToBase64(encryptedMessage) : null;

    socket.emit(
      SocketEvents.SEND_PRIVATE_MESSAGE,
      msgpack.encode({
        recipientId: id,
        message: {
          content: type === ContentType.TEXT ? encryptedMessageBase64 : null,
          contentType: type,
          mediaPath: type !== ContentType.TEXT ? uploadedPath : null,
        },
        encryptedChatKey: !isChatAlreadyExist
          ? encryptedChatKeyForUsersBase64
          : null,
      })
    );

    // Reset the input field and typing indicator
    setTypedText("");
    socket.emit(SocketEvents.IS_NOT_TYPING, msgpack.encode({ toUserId: id }));
  };

  useEffect(() => {
    if (
      !socket ||
      !id ||
      !user ||
      (messages.length > 0 && !encryptedChatKeyRef.current)
    )
      return;

    const handleIsOnline = (
      status: UserStatusEnum.OFFLINE | UserStatusEnum.ONLINE
    ) => {
      setUserStatus(status);
    };

    const handleIsDisconnected = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.OFFLINE);
      }
    };

    const handleIsConnected = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.ONLINE);
      }
    };

    const handleIsTyping = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.TYPING);
      }
    };

    const handleIsNotTyping = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.ONLINE);
      }
    };

    const handleRecieveMessage = async (data: ArrayBuffer) => {
      const { message } = msgpack.decode(new Uint8Array(data)) as {
        message: MessageType & {
          encryptedChatKeys?: Array<{
            userId: string;
            encryptedKey: string;
          }>;
        };
      };

      const privateKey = await getValueFromStoreIDB(user?.userId);
      if (!privateKey) return;

      if (message.encryptedChatKeys) {
        const encryptedKey = message.encryptedChatKeys.find(
          (item) => item.userId === user?.userId
        )?.encryptedKey;

        // convert this encryptedKey(base64) to ArrayBuffer
        const encryptedKeyArrayBuffer = base64ToArrayBuffer(encryptedKey!);

        encryptedChatKeyRef.current = encryptedKeyArrayBuffer!;
      }

      if (message.contentType === ContentType.TEXT) {
        const textArrayBuffer = base64ToArrayBuffer(message?.content!);

        const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
          encryptedChatKeyRef.current!,
          privateKey
        );

        message.text = (await decryptMessage(
          textArrayBuffer,
          decryptedChatKey,
          ContentType.TEXT
        )) as string;
      }

      setMessages((prev) => [...prev, message]);

      if (message.senderId === user?.userId) {
        setSendMessageLoading(false);
      }

      if (message.senderId === user?.userId) {
        new Audio(msgSendSound).play();
      } else if (message.senderId !== user?.userId) {
        new Audio(msgRecieveSound).play();
      }
    };

    const handleDeleteMessage = (messageId: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.messageId === messageId ? { ...item, isDeleted: true } : item
        )
      );
    };

    const handleReadMessage = (messageId: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.messageId === messageId ? { ...item, isRead: true } : item
        )
      );
    };

    socket.emit(SocketEvents.IS_ONLINE, id);

    socket.on(SocketEvents.IS_ONLINE, handleIsOnline);

    socket.on(SocketEvents.IS_DISCONNECTED, handleIsDisconnected);

    socket.on(SocketEvents.IS_CONNECTED, handleIsConnected);

    socket.on(SocketEvents.IS_TYPING, handleIsTyping);

    socket.on(SocketEvents.IS_NOT_TYPING, handleIsNotTyping);

    socket.on(SocketEvents.SEND_PRIVATE_MESSAGE, handleRecieveMessage);

    socket.on(SocketEvents.DELETE_MESSAGE, handleDeleteMessage);

    socket.on(SocketEvents.READ_MESSAGE, handleReadMessage);

    return () => {
      socket.off(SocketEvents.IS_ONLINE, handleIsOnline);
      socket.off(SocketEvents.IS_DISCONNECTED, handleIsDisconnected);
      socket.off(SocketEvents.IS_CONNECTED, handleIsConnected);
      socket.off(SocketEvents.IS_TYPING, handleIsTyping);
      socket.off(SocketEvents.IS_NOT_TYPING, handleIsNotTyping);
      socket.off(SocketEvents.SEND_PRIVATE_MESSAGE, handleRecieveMessage);
      socket.off(SocketEvents.DELETE_MESSAGE, handleDeleteMessage);
      socket.off(SocketEvents.READ_MESSAGE, handleReadMessage);
    };
  }, [id, socket, encryptedChatKeyRef.current]);

  const handleDeleteMsg = (msgId: string) => {
    if (!socket) return;
    socket.emit(
      SocketEvents.DELETE_MESSAGE,
      msgpack.encode({
        messageId: msgId,
        recipientId: id,
      })
    );
  };

  const handleGetMedia = async (
    mediapath: string,
    type: ContentType,
    messageId: string
  ) => {
    if (!user) return;

    setGetMediaLoading((prev) => ({ ...prev, messageId, loading: true }));

    const privateKey = await getValueFromStoreIDB(user.userId);
    if (!privateKey) return;

    const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
      encryptedChatKeyRef.current!,
      privateKey
    );

    const mediaFromApi = await getMediaApi(mediapath);
    // check current size of cache in idb
    const cacheSize = await sizeOfMediaCacheIDB();
    // if cache size is greater than 10 MB, clear oldest media
    if (cacheSize > 10 * 1024 * 1024) {
      await clearOldestMediaCacheIDB();
    }
    // store media in cache
    await addValueToMediaCacheIDB(mediapath, mediaFromApi);

    const selectedMsg = messages.find((item) => item.messageId === messageId);
    if (!selectedMsg) return;

    switch (type) {
      case ContentType.IMAGE:
        selectedMsg.image = (await decryptMessage(
          mediaFromApi,
          decryptedChatKey,
          ContentType.IMAGE
        )) as Blob;
        break;
      case ContentType.AUDIO:
        selectedMsg.audio = (await decryptMessage(
          mediaFromApi,
          decryptedChatKey,
          ContentType.AUDIO
        )) as Blob;
        break;

      default:
        break;
    }

    // set selected message in state with updated media
    setMessages((prev) =>
      prev.map((item) =>
        item.messageId === messageId ? { ...item, ...selectedMsg } : item
      )
    );

    setGetMediaLoading((prev) => ({ ...prev, messageId, loading: false }));
  };

  const handleReadMessage = async (messageId: string) => {
    if (!socket) return;
    socket.emit(
      SocketEvents.READ_MESSAGE,
      msgpack.encode({
        messageId,
      })
    );
  };

  return (
    <>
      <main className="flex flex-col absolute inset-0">
        {isLoading ||
        !socket ||
        (recipient?.chatId && messagesLoading) ||
        chatKeyLoading ||
        !recipient ? (
          <Loader />
        ) : (
          <>
            <ChatHeader
              recipient={recipient}
              userStatus={userStatus}
              isGroup={false}
            />

            <ChatContent
              messages={messages}
              handleDeleteMsg={handleDeleteMsg}
              sendMessageLoading={sendMessageLoading}
              handleGetMedia={handleGetMedia}
              getMediaLoading={getMediaLoading}
              handleReadMessage={handleReadMessage}
            />

            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
            />
          </>
        )}
      </main>
    </>
  );
}
