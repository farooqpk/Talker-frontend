import { MessageType } from "@/components/common/types";
import { ChatContent } from "@/components/chat/chatContent";
import { ChatFooter } from "@/components/chat/chatFooter";
import { ChatHeader } from "@/components/chat/chatHeader";
import Loader from "@/components/loader";
import { useSocket } from "@/context/socketProvider";
import { useGetUser } from "@/hooks/user";
import { decryptMessage, encryptMessage } from "@/lib/ecrypt_decrypt";
import { getMessagesApi } from "@/services/api/chat";
import { getGroupDetailsApi } from "@/services/api/group";
import { ReactElement, useEffect, useState } from "react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";

export const GroupChat = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { isRecording, startRecording, stopRecording, recordingBlob } =
    useAudioRecorder();
  const { privateKey } = useGetUser();
  const [encryptedChatKey, setEncryptedChatKey] = useState("");

  const { data: groupDetails, isLoading: groupDetailsLoading } = useQuery({
    queryKey: [id, "groupdetails"],
    queryFn: () => getGroupDetailsApi(id!),
    onSuccess: (data) => {
      if (data) setEncryptedChatKey(data?.Chat?.ChatKey?.[0]?.encryptedKey);
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesqueryforgroup", id],
    queryFn: () => getMessagesApi(groupDetails?.chatId!),
    enabled: !!groupDetails?.chatId,
    onSuccess: async (data: MessageType[]) => {
      const decryptedData = await Promise.all(
        data?.map(async (message) => {
          if (message.contentType === "TEXT") {
            message.content = await decryptMessage(
              message?.content!,
              encryptedChatKey!,
              privateKey!,
              false
            );
          } else {
            message.audio = await decryptMessage(
              message?.content!,
              encryptedChatKey!,
              privateKey!,
              true
            );
          }

          return message;
        })
      );

      setMessages(decryptedData);
    },
  });

  const handleTyping = (value: string) => {
    setTypedText(value);
  };

  const handleSendMessage = async (type: "TEXT" | "AUDIO") => {
    if (!socket) return;

    const encryptedMessage = await encryptMessage(
      type === "TEXT" ? typedText : recordingBlob!,
      encryptedChatKey,
      privateKey!
    );
    socket.emit("sendMessageForGroup", {
      groupId: id,
      message: {
        content: encryptedMessage,
        contentType: type,
      },
    });
    setTypedText("");
  };

  useEffect(() => {
    if (!socket || !id || !encryptedChatKey || !privateKey) return;

    const handleRecieveMessage = async (message: MessageType) => {
      if (message.contentType === "TEXT") {
        message.content = await decryptMessage(
          message?.content!,
          encryptedChatKey!,
          privateKey!,
          false
        );
      } else {
        message.audio = await decryptMessage(
          message?.content!,
          encryptedChatKey!,
          privateKey!,
          true
        );
      }

      setMessages((prev) => [...prev, message]);
    };

    socket?.on("sendMessageForGroup", handleRecieveMessage);

    socket?.emit("joinGroup", { groupIds: [id] });

    return () => {
      socket?.off("sendMessageForGroup", handleRecieveMessage);
      socket?.emit("leaveGroup", { groupIds: [id] });
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
        {groupDetailsLoading || messagesLoading || !socket ? (
          <Loader />
        ) : (
          <>
            <ChatHeader groupDetails={groupDetails} isGroup key={`${id}+4`} />
            <ChatContent messages={messages} key={`${id}+5`} />
            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
              isRecording={isRecording}
              startRecoring={startRecording}
              stopRecording={stopRecording}
              key={`${id}+6`}
            />
          </>
        )}
      </main>
    </>
  );
};
