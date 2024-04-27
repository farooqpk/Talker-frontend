import { MessageType } from "@/components/common/types";
import { GroupChatContent } from "@/components/groupChat/chatContent";
import { GroupChatFooter } from "@/components/groupChat/chatFooter";
import { GroupChatHeader } from "@/components/groupChat/chatHeader";
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

  const { data: groupDetails, isLoading: groupDetailsLoading } = useQuery({
    queryKey: [id, "groupdetails"],
    queryFn: () => getGroupDetailsApi(id!),
  });

  const encryptedGroupKey = groupDetails?.GroupKey?.[0]?.encryptedGroupKey;

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesqueryforgroup", id],
    queryFn: () => getMessagesApi(groupDetails?.chatId!),
    enabled: !!groupDetails?.chatId,
    onSuccess: async (data: MessageType[]) => {
      const decryptedData = await Promise.all(
        data?.map(async (message) => {
          message.contentForGroup = await decryptMessage(
            message?.contentForGroup!,
            encryptedGroupKey!,
            privateKey!,
            message?.contentType === "TEXT" ? false : true
          );
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
    if (!socket) return;

    const handleRecieveMessage = async (data: MessageType) => {
     console.log(data);
     
      data.contentForGroup = await decryptMessage(
        data?.contentForGroup!,
        encryptedGroupKey!,
        privateKey!,
        data?.contentType === "TEXT" ? false : true
      );
      setMessages((prev) => [...prev, data]);
    };

    socket.on("sendMessageForGroup", handleRecieveMessage);

    return () => {
      socket.off("sendMessageForGroup", handleRecieveMessage);
    };
  }, [id, socket]);

  const handleAudioMessage = async () => {
    if (!socket || !recordingBlob) return;
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
        {groupDetailsLoading || messagesLoading || !socket ? (
          <Loader />
        ) : (
          <>
            <GroupChatHeader groupDetails={groupDetails} />
            <GroupChatContent messages={messages} />
            <GroupChatFooter
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
