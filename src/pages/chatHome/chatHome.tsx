import { ReactElement, useRef } from "react";
import { ChatContent } from "../../components/chatHome/chatContent";
import { ChatFooter } from "../../components/chatHome/chatFooter";
import { ChatHeader } from "../../components/chatHome/chatHeader";
import { useNavigate, useParams } from "react-router-dom";
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


import { confirmAlert } from "react-confirm-alert"; // Import
import "react-confirm-alert/src/react-confirm-alert.css"; // Import css

export const ChatHome = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const { user } = useGetUser();
  const navigate = useNavigate();
  const callTypeRef = useRef<"voice-call" | "video-call">("voice-call");

  const [userStatus, setUserStatus] = useState<UserStatusEnum>(
    UserStatusEnum.OFFLINE
  );
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);

  const { data: recipient, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesquery", id],
    queryFn: () => getMessagesApi(recipient.chatId!),
    enabled: !!recipient?.chatId,
    onSuccess: async (data) => {
      const decryptedData = await Promise.all(
        data.map(async (message: MessageType) => {
          if (user?.userId === message.senderId) {
            message.contentType === "TEXT"
              ? (message.contentForSender = await decryptMessage(
                  message.contentForSender,
                  message.encryptedSymetricKeyForSender,
                  localStorage.getItem("privateKey")!,
                  false
                ))
              : (message.audioForSender = await decryptMessage(
                  message.contentForSender,
                  message.encryptedSymetricKeyForSender,
                  localStorage.getItem("privateKey")!,
                  true
                ));
          } else {
            message.contentType === "TEXT"
              ? (message.contentForRecipient = await decryptMessage(
                  message.contentForRecipient,
                  message.encryptedSymetricKeyForRecipient,
                  localStorage.getItem("privateKey")!,
                  false
                ))
              : (message.audioForRecipient = await decryptMessage(
                  message.contentForRecipient,
                  message.encryptedSymetricKeyForRecipient,
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

    const handleRecieveMessage = async (data: MessageType) => {
      if (user?.userId === data.senderId) {
        data.contentType === "TEXT"
          ? (data.contentForSender = await decryptMessage(
              data.contentForSender,
              data.encryptedSymetricKeyForSender,
              localStorage.getItem("privateKey")!,
              false
            ))
          : (data.audioForSender = await decryptMessage(
              data.contentForSender,
              data.encryptedSymetricKeyForSender,
              localStorage.getItem("privateKey")!,
              true
            ));
      } else {
        data.contentType === "TEXT"
          ? (data.contentForRecipient = await decryptMessage(
              data.contentForRecipient,
              data.encryptedSymetricKeyForRecipient,
              localStorage.getItem("privateKey")!,
              false
            ))
          : (data.audioForRecipient = await decryptMessage(
              data.contentForRecipient,
              data.encryptedSymetricKeyForRecipient,
              localStorage.getItem("privateKey")!,
              true
            ));
      }

      setMessages((prev) => [...prev, data]);
    };

    const handleGetAnotherUserPeerId = (peerId: string) => {
      navigate(
        `/chat/${
          callTypeRef?.current
        }/${id}?peerId=${peerId}&initiateCall=${"true"}`
      );
    };

    const handleAnswerOrRejectCall = (data: any) => {
      console.log(data, "answerOrRejectCall");

      confirmAlert({
        title: `Call from ${data?.fromUsername}`,
        message: "Are you sure to answer or reject the call?",
        buttons: [
          {
            label: "Yes",
            onClick: () =>{
              socket.emit("callAnswered",{toUserId: id})
              navigate(`/chat/${data?.callType}/${id}`)
            },
          },
          {
            label: "No",
            onClick: () => alert("Click No"),
          },
        ],
      });
    };
    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    socket.on("isTyping", handleIsTyping);

    socket.on("isNotTyping", handleIsNotTyping);

    socket.on("sendMessage", handleRecieveMessage);

    socket.on("getAnotherUserPeerId", handleGetAnotherUserPeerId);

    socket.on("answerOrRejectCall", handleAnswerOrRejectCall);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
      socket.off("isTyping", handleIsTyping);
      socket.off("isNotTyping", handleIsNotTyping);
      socket.off("sendMessage", handleRecieveMessage);
      socket.off("getAnotherUserPeerId", handleGetAnotherUserPeerId);
      socket.off("answerOrRejectCall", handleAnswerOrRejectCall);
    };
  }, [id, socket]);

  const { isRecording, startRecording, stopRecording, recordingBlob } =
    useAudioRecorder();

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

  const handleClickCallButton = (type: "voice-call" | "video-call") => {
    if (!socket || !recipient) return;
    callTypeRef.current = type;
    socket?.emit("getAnotherUserPeerId", recipient?.userId);
  };

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
              handleClickCallButton={handleClickCallButton}
            />

            <ChatContent recipient={recipient} messages={messages} />

            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
              isRecording={isRecording}
              startRecoring={startRecording}
              stopRecording={stopRecording}
            />
          </>
        )}
      </main>
    </>
  );
};
