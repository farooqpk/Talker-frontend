import { ContentType, MessageType } from "@/types/index";
import { ChatContent } from "@/components/chat/chatContent";
import { ChatFooter } from "@/components/chat/chatFooter";
import { ChatHeader } from "@/components/chat/chatHeader";
import Loader from "@/components/loader";
import { useSocket } from "@/context/socketProvider";
import { useGetUser } from "@/hooks/user";
import { decryptMessage, encryptMessage } from "@/lib/ecrypt_decrypt";
import { getMessagesApi } from "@/services/api/chat";
import { getGroupDetailsApi } from "@/services/api/group";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export const GroupChat = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { isRecording, startRecording, stopRecording, recordingBlob } =
    useAudioRecorder();
  const { privateKey } = useGetUser();
  const encryptedChatKeyRef = useRef<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useGetUser();

  const { data: groupDetails, isLoading: groupDetailsLoading } = useQuery({
    queryKey: [id, "groupdetails"],
    queryFn: () => getGroupDetailsApi(id!),
    onSuccess: (data) => {
      if (data)
        encryptedChatKeyRef.current = data?.Chat?.ChatKey?.[0]?.encryptedKey;
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesqueryforgroup", id],
    queryFn: () => getMessagesApi(groupDetails?.chatId!),
    enabled: !!groupDetails?.chatId,
    onSuccess: async (data: MessageType[]) => {
      const decryptedData = await Promise.all(
        data?.map(async (message) => {
          if (message.isDeleted) return message;

          if (message.contentType === "TEXT") {
            message.content = await decryptMessage(
              message?.content!,
              encryptedChatKeyRef.current!,
              privateKey!,
              "TEXT"
            );
          } else if (message.contentType === "AUDIO") {
            message.audio = await decryptMessage(
              message?.content!,
              encryptedChatKeyRef.current!,
              privateKey!,
              "AUDIO"
            );
          } else if (message.contentType === "IMAGE") {
            message.image = await decryptMessage(
              message?.content!,
              encryptedChatKeyRef.current!,
              privateKey!,
              "IMAGE"
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

  const handleSendMessage = async (type: ContentType, imgBlob?: Blob) => {
    if (!socket || !encryptedChatKeyRef.current || !privateKey) return;

    const encryptedMessage = await encryptMessage(
      type === "TEXT"
        ? typedText
        : type === "AUDIO"
        ? recordingBlob!
        : type === "IMAGE"
        ? imgBlob!
        : "",
      encryptedChatKeyRef.current!,
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
    if (!socket || !id || !encryptedChatKeyRef.current || !privateKey) return;

    const handleRecieveMessage = async ({
      message,
    }: {
      message: MessageType;
    }) => {
      if (message.contentType === "TEXT") {
        message.content = await decryptMessage(
          message?.content!,
          encryptedChatKeyRef.current!,
          privateKey!,
          "TEXT"
        );
      } else if (message.contentType === "AUDIO") {
        message.audio = await decryptMessage(
          message?.content!,
          encryptedChatKeyRef.current!,
          privateKey!,
          "AUDIO"
        );
      } else if (message.contentType === "IMAGE") {
        message.image = await decryptMessage(
          message?.content!,
          encryptedChatKeyRef.current!,
          privateKey!,
          "IMAGE"
        );
      }

      setMessages((prev) => [...prev, message]);
    };

    const handleDeleteMessage = (messageId: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.messageId === messageId ? { ...item, isDeleted: true } : item
        )
      );
    };

    const handleExitGroup = ({
      isExitByAdmin,
      exitedUserId,
      groupId,
    }: {
      isExitByAdmin: boolean;
      exitedUserId: string;
      groupId: string;
    }) => {
      if (isExitByAdmin || exitedUserId === user?.userId) {
        socket?.emit("leaveGroup", { groupIds: [groupId] });
        navigate("/");
        toast({
          description:
            isExitByAdmin && groupDetails?.adminId !== user?.userId
              ? "Group has been deleted by admin."
              : "Group left successfully.",
        });
      }
    };

    socket?.on("sendMessageForGroup", handleRecieveMessage);
    socket?.emit("joinGroup", { groupIds: [id] });
    socket.on("deleteMessage", handleDeleteMessage);
    socket.on("exitGroup", handleExitGroup);

    return () => {
      socket?.off("sendMessageForGroup", handleRecieveMessage);
      socket?.emit("leaveGroup", { groupIds: [id] });
      socket.off("deleteMessage", handleDeleteMessage);
      socket.off("exitGroup", handleExitGroup);
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
    socket.emit("deleteMessage", {
      messageId: msgId,
      groupId: id,
      isGroup: true,
    });
  };

  const handleExitGroup = () => {
    if (!socket) return;
    socket.emit("exitGroup", {
      groupId: id,
    });
  };

  return (
    <>
      <main className="flex flex-col relative">
        {groupDetailsLoading || messagesLoading || !socket ? (
          <Loader />
        ) : (
          <>
            <ChatHeader
              groupDetails={groupDetails}
              isGroup
              key={`${id}+4`}
              handleExitGroup={handleExitGroup}
            />
            <ChatContent
              messages={messages}
              key={`${id}+5`}
              handleDeleteMsg={handleDeleteMsg}
            />
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
