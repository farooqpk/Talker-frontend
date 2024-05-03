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
import { MessageType, UserStatusEnum } from "@/components/common/types";
import { getMessagesApi } from "@/services/api/chat";
import { decryptMessage, encryptMessage } from "@/lib/ecrypt_decrypt";
import { useGetUser } from "@/hooks/user";
import { useAudioRecorder } from "react-audio-voice-recorder";

export const PersonalChat = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const { user } = useGetUser();
  const [userStatus, setUserStatus] = useState<UserStatusEnum>(
    UserStatusEnum.OFFLINE
  );
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { isRecording, startRecording, stopRecording, recordingBlob } =
    useAudioRecorder();

  const { data: recipient, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesquery", id],
    queryFn: () => getMessagesApi(recipient.chatId!),
    enabled: !!recipient?.chatId,
    onSuccess: async (data: MessageType[]) => {
      const decryptedData = await Promise.all(
        data.map(async (message) => {
          if (user?.userId === message.senderId) {
            message.contentType === "TEXT"
              ? (message.contentForSender = await decryptMessage(
                  message?.contentForSender!,
                  message?.encryptedSymetricKeyForSender!,
                  localStorage.getItem("privateKey")!,
                  false
                ))
              : (message.audioForSender = await decryptMessage(
                  message?.contentForSender!,
                  message?.encryptedSymetricKeyForSender!,
                  localStorage.getItem("privateKey")!,
                  true
                ));
          } else {
            message.contentType === "TEXT"
              ? (message.contentForRecipient = await decryptMessage(
                  message?.contentForRecipient!,
                  message?.encryptedSymetricKeyForRecipient!,
                  localStorage.getItem("privateKey")!,
                  false
                ))
              : (message.audioForRecipient = await decryptMessage(
                  message?.contentForRecipient!,
                  message?.encryptedSymetricKeyForRecipient!,
                  localStorage.getItem("privateKey")!,
                  true
                ));
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
      socket.emit("isTyping", { toUserId: id });
    } else {
      socket.emit("isNotTyping", { toUserId: id });
    }
  };

  const handleSendMessage = async () => {
    if (!socket || !recipient) return;

    const {
      encryptedMessage: encryptedMessageForRecipient,
      encryptedSymetricKey: encryptedSymetricKeyForRecipient,
    } = await encryptMessage(
      typedText,
      localStorage.getItem("symetricKey")!,
      recipient.publicKey
    );
    const {
      encryptedMessage: encryptedMessageForSender,
      encryptedSymetricKey: encryptedSymetricKeyForSender,
    } = await encryptMessage(
      typedText,
      localStorage.getItem("symetricKey")!,
      localStorage.getItem("publicKey")!
    );

    socket.emit("sendMessage", {
      userId: id,
      message: {
        encryptedMessageForRecipient,
        encryptedSymetricKeyForRecipient,
        encryptedMessageForSender,
        encryptedSymetricKeyForSender,
        contentType: "TEXT",
      },
    });
    setTypedText("");
    socket.emit("isNotTyping", { toUserId: id });
  };

  useEffect(() => {
    if (!socket) return;

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
      if (user?.userId === message.senderId) {
        message.contentType === "TEXT"
          ? (message.contentForSender = await decryptMessage(
              message?.contentForSender!,
              message?.encryptedSymetricKeyForSender!,
              localStorage.getItem("privateKey")!,
              false
            ))
          : (message.audioForSender = await decryptMessage(
              message?.contentForSender!,
              message?.encryptedSymetricKeyForSender!,
              localStorage.getItem("privateKey")!,
              true
            ));
      } else {
        message.contentType === "TEXT"
          ? (message.contentForRecipient = await decryptMessage(
              message?.contentForRecipient!,
              message?.encryptedSymetricKeyForRecipient!,
              localStorage.getItem("privateKey")!,
              false
            ))
          : (message.audioForRecipient = await decryptMessage(
              message?.contentForRecipient!,
              message?.encryptedSymetricKeyForRecipient!,
              localStorage.getItem("privateKey")!,
              true
            ));
      }

      setMessages((prev) => [...prev, message]);
    };

    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    socket.on("isTyping", handleIsTyping);

    socket.on("isNotTyping", handleIsNotTyping);

    socket.on("sendMessage", handleRecieveMessage);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
      socket.off("isTyping", handleIsTyping);
      socket.off("isNotTyping", handleIsNotTyping);
      socket.off("sendMessage", handleRecieveMessage);
    };
  }, [id, socket]);

  const handleAudioMessage = async () => {
    if (!socket || !recipient || !recordingBlob) return;

    const {
      encryptedMessage: encryptedMessageForRecipient,
      encryptedSymetricKey: encryptedSymetricKeyForRecipient,
    } = await encryptMessage(
      recordingBlob,
      localStorage.getItem("symetricKey")!,
      recipient.publicKey
    );
    const {
      encryptedMessage: encryptedMessageForSender,
      encryptedSymetricKey: encryptedSymetricKeyForSender,
    } = await encryptMessage(
      recordingBlob,
      localStorage.getItem("symetricKey")!,
      localStorage.getItem("publicKey")!
    );

    socket.emit("sendMessage", {
      userId: id,
      message: {
        encryptedMessageForRecipient,
        encryptedSymetricKeyForRecipient,
        encryptedMessageForSender,
        encryptedSymetricKeyForSender,
        contentType: "AUDIO",
      },
    });
  };

  useEffect(() => {
    const sendAudioMessage = async () => {
      if (recordingBlob) {
        try {
          await handleAudioMessage();
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
        {isLoading || !socket || (recipient?.chatId && messagesLoading) ? (
          <Loader />
        ) : (
          <>
            <ChatHeader
              recipient={recipient}
              userStatus={userStatus}
              key={id}
              isGroup={false}
            />

            <ChatContent
              recipient={recipient}
              messages={messages}
              isGroup={false}
              key={id}
            />

            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
              isRecording={isRecording}
              startRecoring={startRecording}
              stopRecording={stopRecording}
              key={id}
            />
          </>
        )}
      </main>
    </>
  );
};
