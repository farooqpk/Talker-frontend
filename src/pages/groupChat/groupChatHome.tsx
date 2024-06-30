import { ContentType, MessageType, SocketEvents } from "@/types/index";
import { useSocket } from "@/context/socketProvider";
import { useGetUser } from "@/hooks/useGetUser";
import {
  decryptMessage,
  decryptSymetricKeyWithPrivateKey,
  encryptMessage,
} from "@/lib/ecrypt_decrypt";
import {
  getMediaApi,
  getMessagesApi,
  getSignedUrlApi,
  uploadToSignedUrlApi,
} from "@/services/api/chat";
import { getGroupDetailsApi } from "@/services/api/group";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import msgRecieveSound from "../../assets/Pocket.mp3";
import msgSendSound from "../../assets/Solo.mp3";
import { addValueToMediaCacheIDB, getValueFromMediaCacheIDB, getValueFromStoreIDB } from "@/lib/idb";
import ChatContent from "@/components/chat/chatContent";
import ChatFooter from "@/components/chat/chatFooter";
import ChatHeader from "@/components/chat/chatHeader";
import Loader from "@/components/loader";
import {
  decode as base64ToArrayBuffer,
  encode as arrayBufferToBase64,
} from "base64-arraybuffer";

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
  const encryptedChatKeyRef = useRef<ArrayBuffer | undefined>(undefined);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useGetUser();
  const sendMessageLoadingRef = useRef<boolean>(false);
  const [getMediaLoading, setGetMediaLoading] = useState<{
    messageId: string;
    loading: boolean;
  }>({ messageId: "", loading: false });

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
        const encryptedKey = data?.Chat?.ChatKey?.[0]?.encryptedKey;
        const encryptedKeyArrayBuffer = base64ToArrayBuffer(encryptedKey);
        encryptedChatKeyRef.current = encryptedKeyArrayBuffer;
      }
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesqueryforgroup", id],
    queryFn: () => getMessagesApi(groupDetails?.chatId!),
    enabled: !!groupDetails?.chatId && !!encryptedChatKeyRef.current,
    onSuccess: async (data: MessageType[]) => {
      if (!data || !user) return;

      const privateKey = await getValueFromStoreIDB(user.userId);

      if (!privateKey) return;

      const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
        encryptedChatKeyRef.current!,
        privateKey
      );

      const decryptedData = await Promise.all(
        data.map(async (message) => {
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
              const getMediaFromCache = await getValueFromMediaCacheIDB(message.mediaPath!)
              if (!getMediaFromCache) break;
              message.image = await decryptMessage(
                getMediaFromCache,
                decryptedChatKey,
                ContentType.IMAGE
              ) as Blob;
              break
            }

            case ContentType.AUDIO: {
              const getMediaFromCache = await getValueFromMediaCacheIDB(message.mediaPath!)
              if (!getMediaFromCache) break;
              message.image = await decryptMessage(
                getMediaFromCache,
                decryptedChatKey,
                ContentType.IMAGE
              ) as Blob;
              break
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
    setTypedText(value);
  };

  const handleSendMessage = async (type: ContentType, imgBlob?: Blob) => {
    if (!socket || !encryptedChatKeyRef.current || !user) return;

    const privateKey = await getValueFromStoreIDB(user.userId);

    sendMessageLoadingRef.current = true;

    const chatContent =
      type === "TEXT"
        ? typedText
        : type === "IMAGE"
          ? imgBlob!
          : type === "AUDIO"
            ? recordingBlob!
            : "";

    const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
      encryptedChatKeyRef.current!,
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

      console.log(url);
    }

    // convert message to base64 for sending to server
    const encryptedMessageBase64 =
      type === ContentType.TEXT ? arrayBufferToBase64(encryptedMessage) : null;

    socket.emit(SocketEvents.SEND_GROUP_MESSAGE, {
      groupId: id,
      message: {
        content: type === ContentType.TEXT ? encryptedMessageBase64 : null,
        contentType: type,
        mediaPath: type !== ContentType.TEXT ? uploadedPath : null,
      },
    });

    setTypedText("");
  };

  useEffect(() => {
    if (!socket || !id || !encryptedChatKeyRef.current || !user) return;

    const recieveMessage = async ({ message }: { message: MessageType }) => {
      const privateKey = await getValueFromStoreIDB(user.userId);
      if (!privateKey) return;

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
        socket?.emit(SocketEvents.LEAVE_GROUP, { groupIds: [groupId] });
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

    socket?.on(SocketEvents.SEND_GROUP_MESSAGE, recieveMessage);
    socket?.emit(SocketEvents.JOIN_GROUP, { groupIds: [id] });
    socket.on(SocketEvents.DELETE_MESSAGE, deleteMessageReceiver);
    socket.on(SocketEvents.EXIT_GROUP, exitGroupReceiver);
    socket.on(SocketEvents.UPDATE_GROUP_DETAILS, updateGroupDetailsReceiver);

    return () => {
      socket?.off(SocketEvents.SEND_GROUP_MESSAGE, recieveMessage);
      socket?.emit(SocketEvents.LEAVE_GROUP, { groupIds: [id] });
      socket.off(SocketEvents.DELETE_MESSAGE, recieveMessage);
      socket.off(SocketEvents.EXIT_GROUP, exitGroupReceiver);
      socket.off(SocketEvents.UPDATE_GROUP_DETAILS, updateGroupDetailsReceiver);
    };
  }, [id, socket, encryptedChatKeyRef.current, user]);

  useEffect(() => {
    if (!recordingBlob) return;
    const sendAudioMessage = async () => {
      try {
        await handleSendMessage(ContentType.AUDIO);
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
    socket.emit(SocketEvents.DELETE_MESSAGE, {
      messageId: msgId,
      groupId: id,
      isGroup: true,
    });
  };

  const handleExitGroup = () => {
    if (!socket) return;
    socket.emit(SocketEvents.EXIT_GROUP, {
      groupId: id,
    });
  };

  const handleUpdateGroupDetails = (data: {
    name?: string;
    description?: string;
  }) => {
    socket?.emit(SocketEvents.UPDATE_GROUP_DETAILS, { groupId: id, ...data });
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
              handleExitGroup={handleExitGroup}
              handleUpdateGroupDetails={handleUpdateGroupDetails}
            />
            <ChatContent
              messages={messages}
              handleDeleteMsg={handleDeleteMsg}
              sendMessageLoadingRef={sendMessageLoadingRef}
              getMediaLoading={getMediaLoading}
              handleGetMedia={handleGetMedia}
            />
            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
              isRecording={isRecording}
              startRecoring={startRecording}
              stopRecording={stopRecording}
              recordingTime={recordingTime}
            />
          </>
        )}
      </main>
    </>
  );
}
