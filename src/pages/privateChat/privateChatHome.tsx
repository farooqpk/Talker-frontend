import { ReactElement } from "react";
import { ChatContent } from "../../components/chat/chatContent";
import { ChatFooter } from "../../components/chat/chatFooter";
import { ChatHeader } from "../../components/chat/chatHeader";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { findUserApi } from "@/services/api/user";
import Loader from "@/components/loader";
import { useSocket } from "@/context/socketProvider";
import { useEffect, useState } from "react";
import { MessageType, UserStatusEnum } from "@/types/index";
import { getChatKeyApi, getMessagesApi } from "@/services/api/chat";
import {
  createSymetricKey,
  decryptMessage,
  encryptMessage,
  encryptSymetricKey,
} from "@/lib/ecrypt_decrypt";
import { useGetUser } from "@/hooks/user";
import { useAudioRecorder } from "react-audio-voice-recorder";

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
  const [encryptedChatKey, setEncryptedChatKey] = useState("");

  const { data: recipient, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const { isLoading: chatKeyLoading } = useQuery({
    queryKey: ["chatKeyquery", recipient?.chatId],
    enabled: !!recipient?.chatId,
    queryFn: () => getChatKeyApi(recipient?.chatId!),
    onSuccess: (data) => {
      if (data) setEncryptedChatKey(data?.encryptedKey);
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesquery", recipient?.chatId],
    queryFn: () => getMessagesApi(recipient.chatId!),
    enabled: !!recipient?.chatId && !!encryptedChatKey,
    onSuccess: async (data: MessageType[]) => {
      const decryptedData = await Promise.all(
        data?.map(async (message) => {
          message.contentType === "TEXT"
            ? (message.content = await decryptMessage(
                message?.content!,
                encryptedChatKey!,
                privateKey!,
                false
              ))
            : (message.audio = await decryptMessage(
                message?.content!,
                encryptedChatKey!,
                privateKey!,
                true
              ));

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

  const handleSendMessage = async (type: "TEXT" | "AUDIO") => {
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
      setEncryptedChatKey(ourOwnEncryptedChatKey);
    }

    const encryptedMessage = await encryptMessage(
      type === "TEXT" ? typedText : recordingBlob!,
      isChatAlreadyExist ? encryptedChatKey : ourOwnEncryptedChatKey!,
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
    if (!socket || !id || !encryptedChatKey || !privateKey) return;

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
      message: MessageType;
    }) => {
      message.contentType === "TEXT"
        ? (message.content = await decryptMessage(
            message?.content!,
            encryptedChatKey!,
            privateKey!,
            false
          ))
        : (message.audio = await decryptMessage(
            message?.content!,
            encryptedChatKey!,
            privateKey!,
            true
          ));

      setMessages((prev) => [...prev, message]);
    };

    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    socket.on("isTyping", handleIsTyping);

    socket.on("isNotTyping", handleIsNotTyping);

    socket.on("sendPrivateMessage", handleRecieveMessage);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
      socket.off("isTyping", handleIsTyping);
      socket.off("isNotTyping", handleIsNotTyping);
      socket.off("sendPrivateMessage", handleRecieveMessage);
    };
  }, [id, socket, encryptedChatKey, privateKey]);

  useEffect(() => {
    const sendAudioMessage = async () => {
      if (recordingBlob) {
        try {
          await handleSendMessage("AUDIO");
        } catch (error) {
          console.error("Error sending audio message:", error);
          // Handle the error (e.g., display an error message to the user)
        }
      }
    };

    sendAudioMessage();
  }, [recordingBlob]);

  return (
    <>
      <main className="h-screen flex flex-col relative">
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

            <ChatContent messages={messages} key={`${id}+2`} />

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
