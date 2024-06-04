import { ContentType, MessageType } from "@/types/index";
import { useSocket } from "@/context/socketProvider";
import { useGetUser } from "@/hooks/useGetUser";
import { decryptMessage, encryptMessage } from "@/lib/ecrypt_decrypt";
import { getMessagesApi } from "@/services/api/chat";
import { getGroupDetailsApi } from "@/services/api/group";
import { ReactElement, lazy, useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import msgRecieveSound from "../../assets/Pocket.mp3";
import msgSendSound from "../../assets/Solo.mp3";
import { getValueFromStoreIDB } from "@/lib/idb";
const ChatContent = lazy(() => import("@/components/chat/chatContent"));
const ChatFooter = lazy(()=> import("@/components/chat/chatFooter"));
const ChatHeader = lazy(() => import("@/components/chat/chatHeader"));
const Loader = lazy(() => import("@/components/loader"));

export default function GroupChat(): ReactElement {
  const { id } = useParams();
  const socket = useSocket();
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const {
    isRecording,
    startRecording,
    stopRecording,
    recordingBlob,
    recordingTime,
  } = useAudioRecorder();
  const encryptedChatKeyRef = useRef<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useGetUser();
  const sendMessageLoadingRef = useRef<boolean>(false);

  const {
    data: groupDetails,
    isLoading: groupDetailsLoading,
    refetch: refetchGroup,
  } = useQuery({
    queryKey: [id, "groupdetails"],
    queryFn: () => getGroupDetailsApi(id!),
    enabled: !!id,
    onSuccess: (data) => {
      if (data) {
        encryptedChatKeyRef.current = data?.Chat?.ChatKey?.[0]?.encryptedKey;
      }
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesqueryforgroup", id],
    queryFn: () => getMessagesApi(groupDetails?.chatId!),
    enabled: !!groupDetails?.chatId && !!encryptedChatKeyRef.current,
    onSuccess: async (data: MessageType[]) => {
      if (!data || !user) return;

      const privateKey = await getValueFromStoreIDB(user.userId)

      const decryptedData = await Promise.all(
        data.map(async (message) => {
          if (message.isDeleted) return message;

          if (message.contentType === "TEXT") {
            message.content = await decryptMessage(
              message?.content!,
              encryptedChatKeyRef.current!,
              privateKey,
              "TEXT"
            );
          } else if (message.contentType === "AUDIO") {
            message.audio = await decryptMessage(
              message?.content!,
              encryptedChatKeyRef.current!,
              privateKey,
              "AUDIO"
            );
          } else if (message.contentType === "IMAGE") {
            message.image = await decryptMessage(
              message?.content!,
              encryptedChatKeyRef.current!,
              privateKey,
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
    if (!socket || !encryptedChatKeyRef.current || !user) return;

    const privateKey = await getValueFromStoreIDB(user.userId)

    sendMessageLoadingRef.current = true;

    const chatContent =
      type === "TEXT"
        ? typedText
        : type === "IMAGE"
        ? imgBlob!
        : type === "AUDIO"
        ? recordingBlob!
        : "";

    const encryptedMessage = await encryptMessage(
      chatContent,
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
    if (!socket || !id || !encryptedChatKeyRef.current ||!user) return;

    const recieveMessage = async ({ message }: { message: MessageType }) => {

      const privateKey = await getValueFromStoreIDB(user.userId)

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

      if (message.senderId === user?.userId) {
        sendMessageLoadingRef.current = false;
      }

      await new Audio(
        message.senderId === user?.userId ? msgSendSound : msgRecieveSound
      ).play();
    };

    const deleteMessageReceiver = (messageId: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.messageId === messageId ? { ...item, isDeleted: true } : item
        )
      );
    };

    const exitGroupReceiver = ({
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

    const updateGroupDetailsReceiver = () => {
      refetchGroup();
    };

    socket?.on("sendMessageForGroup", recieveMessage);
    socket?.emit("joinGroup", { groupIds: [id] });
    socket.on("deleteMessage", deleteMessageReceiver);
    socket.on("exitGroup", exitGroupReceiver);
    socket.on("updateGroupDetails", updateGroupDetailsReceiver);

    return () => {
      socket?.off("sendMessageForGroup", recieveMessage);
      socket?.emit("leaveGroup", { groupIds: [id] });
      socket.off("deleteMessage", recieveMessage);
      socket.off("exitGroup", exitGroupReceiver);
      socket.off("updateGroupDetails", updateGroupDetailsReceiver);
    };
  }, [id, socket, encryptedChatKeyRef.current,user]);

  useEffect(() => {
    if (!recordingBlob) return;
    const sendAudioMessage = async () => {
      try {
        await handleSendMessage("AUDIO");
      } catch (error) {
        toast({
          title: "Error sending audio message",
          variant: "destructive",
        });
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

  const handleUpdateGroupDetails = (data: {
    name?: string;
    description?: string;
  }) => {
    socket?.emit("updateGroupDetails", { groupId: id, ...data });
  };

  return (
    <>
      <main className="flex flex-col h-full">
        {groupDetailsLoading || messagesLoading || !socket ? (
          <Loader />
        ) : (
          <>
            <ChatHeader
              groupDetails={groupDetails}
              isGroup
              key={`${id}+4`}
              handleExitGroup={handleExitGroup}
              handleUpdateGroupDetails={handleUpdateGroupDetails}
            />
            <ChatContent
              messages={messages}
              key={`${id}+5`}
              handleDeleteMsg={handleDeleteMsg}
              sendMessageLoadingRef={sendMessageLoadingRef}
            />
            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
              isRecording={isRecording}
              startRecoring={startRecording}
              stopRecording={stopRecording}
              recordingTime={recordingTime}
              key={`${id}+6`}
            />
          </>
        )}
      </main>
    </>
  );
}
