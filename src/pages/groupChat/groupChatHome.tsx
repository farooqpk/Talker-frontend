import { MessageType } from "@/components/common/types";
import { ChatContent } from "@/components/chat/chatContent";
import { ChatFooter } from "@/components/chat/chatFooter";
import { ChatHeader } from "@/components/chat/chatHeader";
import Loader from "@/components/loader";
import { useSocket } from "@/context/socketProvider";
import { useGetUser } from "@/hooks/user";
import { decryptMessage, encryptMessageForGroup } from "@/lib/ecrypt_decrypt";
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
  const [encryptedGroupKey, setEncryptedGroupKey] = useState("");

  const { data: groupDetails, isLoading: groupDetailsLoading } = useQuery({
    queryKey: [id, "groupdetails"],
    queryFn: () => getGroupDetailsApi(id!),
    onSuccess: (data) => {
      if (data) setEncryptedGroupKey(data?.GroupKey?.[0]?.encryptedGroupKey);
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
            message.contentForGroup = await decryptMessage(
              message?.contentForGroup!,
              encryptedGroupKey!,
              privateKey!,
              false
            );
          } else {
            message.audioForGroup = await decryptMessage(
              message?.contentForGroup!,
              encryptedGroupKey!,
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

  const handleSendMessage = async () => {
    if (!socket) return;

    const encryptedMessage = await encryptMessageForGroup(
      typedText,
      encryptedGroupKey,
      privateKey!
    );
    socket.emit("sendMessageForGroup", {
      groupId: id,
      message: {
        contentForGroup: encryptedMessage,
        contentType: "TEXT",
      },
    });
    setTypedText("");
  };

  useEffect(() => {
    if (!socket || !id || !encryptedGroupKey || !privateKey) return;

    const handleRecieveMessage = async (message: MessageType) => {
      if (message.contentType === "TEXT") {
        message.contentForGroup = await decryptMessage(
          message?.contentForGroup!,
          encryptedGroupKey!,
          privateKey!,
          false
        );
      } else {
        message.audioForGroup = await decryptMessage(
          message?.contentForGroup!,
          encryptedGroupKey!,
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
  }, [id, socket, encryptedGroupKey, privateKey]);

  const handleAudioMessage = async () => {
    if (!socket || !recordingBlob) return;
    const encryptedMessage = await encryptMessageForGroup(
      recordingBlob,
      encryptedGroupKey,
      privateKey!
    );
    socket.emit("sendMessageForGroup", {
      groupId: id,
      message: {
        contentForGroup: encryptedMessage,
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
        {groupDetailsLoading ||
        messagesLoading ||
        !socket ||
        !encryptedGroupKey ? (
          <Loader />
        ) : (
          <>
            <ChatHeader groupDetails={groupDetails} isGroup />
            <ChatContent messages={messages} isGroup key={id} />
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
