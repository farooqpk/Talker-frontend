import { ReactElement, useRef } from "react";
import { ChatContent } from "../../components/chat/chatContent";
import { ChatFooter } from "../../components/chat/chatFooter";
import { ChatHeader } from "../../components/chat/chatHeader";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { findUserApi } from "@/services/api/user";
import Loader from "@/components/loader";
import { useSocket } from "@/context/socketProvider";
import { useEffect, useState } from "react";
import { ContentType, MessageType, UserStatusEnum } from "@/types/index";
import { getChatKeyApi, getMessagesApi } from "@/services/api/chat";
import {
  createSymetricKey,
  decryptMessage,
  encryptMessage,
  encryptSymetricKey,
} from "@/lib/ecrypt_decrypt";
import { useGetUser } from "@/hooks/user";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useToast } from "@/components/ui/use-toast";

export const PrivateChat = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const { privateKey, publicKey, user } = useGetUser();
  const [userStatus, setUserStatus] = useState<UserStatusEnum>(
    UserStatusEnum.OFFLINE
  );
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { isRecording, startRecording, stopRecording, recordingBlob } =
    useAudioRecorder();
  const encryptedChatKeyRef = useRef<string>("");
  const { toast } = useToast();

  const { data: recipient, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const { isLoading: chatKeyLoading } = useQuery({
    queryKey: ["chatKeyquery", recipient?.chatId],
    enabled: !!recipient?.chatId,
    queryFn: () => getChatKeyApi(recipient?.chatId!),
    onSuccess: (data) => {
      if (data) encryptedChatKeyRef.current = data?.encryptedKey;
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesquery", recipient?.chatId],
    queryFn: () => getMessagesApi(recipient.chatId!),
    enabled: !!recipient?.chatId && !!encryptedChatKeyRef.current,
    onSuccess: async (data: MessageType[]) => {
      const decryptedData = await Promise.all(
        data?.map(async (message) => {
          if (message.isDeleted) return message;

          message.contentType === "TEXT"
            ? (message.content = await decryptMessage(
                message?.content!,
                encryptedChatKeyRef.current!,
                privateKey!,
                "TEXT"
              ))
            : message.contentType === "AUDIO"
            ? (message.audio = await decryptMessage(
                message?.content!,
                encryptedChatKeyRef.current!,
                privateKey!,
                "AUDIO"
              ))
            : message.contentType === "IMAGE"
            ? (message.image = await decryptMessage(
                message?.content!,
                encryptedChatKeyRef.current!,
                privateKey!,
                "IMAGE"
              ))
            : null;

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
      socket.emit("isTyping", { toUserId: id });
    } else {
      socket.emit("isNotTyping", { toUserId: id });
    }
  };

  const handleSendMessage = async (type: ContentType, imgBlob?: Blob) => {
    if (!socket || !recipient || !publicKey || !privateKey) return;

    const isChatAlreadyExist = recipient?.chatId;

    let encryptedChatKeyForUsers: Array<{
      userId: string;
      encryptedKey: string;
    }> = [];
    let ourOwnEncryptedChatKey: string | undefined;

    if (!isChatAlreadyExist) {
      const chatKey = await createSymetricKey();

      const usersWithPublicKey = [
        { userId: user?.userId, publicKey },
        { userId: recipient?.userId, publicKey: recipient?.publicKey },
      ];

      await Promise.all(
        usersWithPublicKey.map(async (item) => {
          const encryptedKey = await encryptSymetricKey(
            chatKey,
            item.publicKey
          );

          encryptedChatKeyForUsers.push({
            userId: item.userId,
            encryptedKey,
          });
        })
      );

      ourOwnEncryptedChatKey = encryptedChatKeyForUsers.find(
        (item) => item.userId === user?.userId
      )?.encryptedKey!;
      encryptedChatKeyRef.current = ourOwnEncryptedChatKey;
    }

    const encryptedMessage = await encryptMessage(
      type === "TEXT"
        ? typedText
        : type === "AUDIO"
        ? recordingBlob!
        : type === "IMAGE"
        ? imgBlob!
        : "",
      isChatAlreadyExist
        ? encryptedChatKeyRef.current
        : ourOwnEncryptedChatKey!,
      privateKey!
    );

    socket.emit("sendPrivateMessage", {
      recipientId: id,
      message: {
        content: encryptedMessage,
        contentType: type,
      },
      encryptedChatKey: !isChatAlreadyExist && encryptedChatKeyForUsers,
    });

    setTypedText("");
    socket.emit("isNotTyping", { toUserId: id });
  };

  useEffect(() => {
    if (
      !socket ||
      !id ||
      !privateKey ||
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

    const handleRecieveMessage = async ({
      message,
    }: {
      message: MessageType & {
        encryptedChatKeys?: Array<{ userId: string; encryptedKey: string }>;
      };
    }) => {
      if (message.encryptedChatKeys) {
        const encryptedKey = message.encryptedChatKeys.find(
          (item) => item.userId === user?.userId
        )?.encryptedKey;
        encryptedChatKeyRef.current = encryptedKey!;
      }

      message.contentType === "TEXT"
        ? (message.content = await decryptMessage(
            message?.content!,
            encryptedChatKeyRef.current!,
            privateKey!,
            "TEXT"
          ))
        : message.contentType === "AUDIO"
        ? (message.audio = await decryptMessage(
            message?.content!,
            encryptedChatKeyRef.current!,
            privateKey!,
            "AUDIO"
          ))
        : message.contentType === "IMAGE"
        ? (message.image = await decryptMessage(
            message?.content!,
            encryptedChatKeyRef.current!,
            privateKey!,
            "IMAGE"
          ))
        : null;

      setMessages((prev) => [...prev, message]);
    };

    const handleDeleteMessage = (messageId: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.messageId === messageId ? { ...item, isDeleted: true } : item
        )
      );
    };

    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    socket.on("isTyping", handleIsTyping);

    socket.on("isNotTyping", handleIsNotTyping);

    socket.on("sendPrivateMessage", handleRecieveMessage);

    socket.on("deleteMessage", handleDeleteMessage);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
      socket.off("isTyping", handleIsTyping);
      socket.off("isNotTyping", handleIsNotTyping);
      socket.off("sendPrivateMessage", handleRecieveMessage);
      socket.off("deleteMessage", handleDeleteMessage);
    };
  }, [id, socket, encryptedChatKeyRef.current, privateKey]);

  useEffect(() => {
    const sendAudioMessage = async () => {
      if (recordingBlob) {
        try {
          await handleSendMessage("AUDIO");
        } catch (error) {
          toast({
            title: "Error sending audio message",
            variant: "destructive",
          });
        }
      }
    };

    sendAudioMessage();
  }, [recordingBlob]);

  const handleDeleteMsg = (msgId: string) => {
    if (!socket) return;
    socket.emit("deleteMessage", { messageId: msgId, recipientId: id });
  };

  return (
    <>
      <main className="flex flex-col relative">
        {isLoading ||
        !socket ||
        (recipient?.chatId && messagesLoading) ||
        chatKeyLoading ? (
          <Loader />
        ) : (
          <>
            <ChatHeader
              recipient={recipient}
              userStatus={userStatus}
              key={`${id}+1`}
              isGroup={false}
            />

            <ChatContent
              messages={messages}
              key={`${id}+2`}
              handleDeleteMsg={handleDeleteMsg}
            />

            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
              isRecording={isRecording}
              startRecoring={startRecording}
              stopRecording={stopRecording}
              key={`${id}+3`}
            />
          </>
        )}
      </main>
    </>
  );
};
