import { ContentType, MessageType, SocketEvents } from "@/types/index";
import { useSocket } from "@/context/socketProvider";
import { useGetUser } from "@/hooks/useGetUser";
import {
  decryptMessage,
  decryptSymetricKeyWithPrivateKey,
  encryptMessage,
  encryptSymetricKeyWithPublicKey,
} from "@/lib/ecrypt_decrypt";
import {
  getMediaApi,
  getMessagesApi,
  getSignedUrlApi,
  uploadToSignedUrlApi,
} from "@/services/api/chat";
import { getGroupDetailsApi, getPublicKeysApi } from "@/services/api/group";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import msgRecieveSound from "../../assets/Pocket.mp3";
import msgSendSound from "../../assets/Solo.mp3";
import {
  addValueToMediaCacheIDB,
  clearOldestMediaCacheIDB,
  getValueFromMediaCacheIDB,
  getValueFromStoreIDB,
  sizeOfMediaCacheIDB,
} from "@/lib/idb";
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
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [getMediaLoading, setGetMediaLoading] = useState<{
    messageId: string;
    loading: boolean;
  }>({ messageId: "", loading: false });
  const [isAddingNewMembersLoading, setIsAddingNewMembersLoading] =
    useState(false);

  const {
    data: groupDetails,
    isLoading: groupDetailsLoading,
    refetch: refetchGroup,
  } = useQuery({
    queryKey: [id, "groupdetails"],
    queryFn: () => getGroupDetailsApi(id!),
    enabled: !!id,
    onSuccess: (data) => {
      if (!data) navigate("/");
      const encryptedKey = data?.chat?.encryptedKey;
      const encryptedKeyArrayBuffer = base64ToArrayBuffer(encryptedKey);
      encryptedChatKeyRef.current = encryptedKeyArrayBuffer;
    },
    onError: () => {
      navigate("/");
    },
  });

  const { isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
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
              const getMediaFromCache = await getValueFromMediaCacheIDB(
                message.mediaPath!
              );
              if (!getMediaFromCache) break;
              message.image = (await decryptMessage(
                getMediaFromCache,
                decryptedChatKey,
                ContentType.IMAGE
              )) as Blob;
              break;
            }

            case ContentType.AUDIO: {
              const getMediaFromCache = await getValueFromMediaCacheIDB(
                message.mediaPath!
              );
              if (!getMediaFromCache) break;
              message.image = (await decryptMessage(
                getMediaFromCache,
                decryptedChatKey,
                ContentType.IMAGE
              )) as Blob;
              break;
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

    setSendMessageLoading(true);

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
        setSendMessageLoading(false);
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
      exitedUserId,
      groupId,
    }: {
      exitedUserId: string;
      groupId: string;
    }) => {
      if (exitedUserId === user?.userId) {
        socket?.emit(SocketEvents.LEAVE_GROUP, { groupIds: [groupId] });
        toast({
          description: "Group left successfully.",
        });
        navigate("/");
      } else {
        refetchGroup();
      }
    };

    const updateGroupDetailsReceiver = () => {
      refetchGroup();
    };

    const kickMemberReceiver = async ({
      removedUserId,
      removedUserName,
    }: {
      removedUserId: string;
      removedUserName: string;
    }) => {
      if (removedUserId === user?.userId) {
        toast({
          description: "You have been kicked from the group.",
        });
        navigate("/");
      } else {
        await Promise.all([refetchGroup(), refetchMessages()]);
        toast({
          description: `${removedUserName} has been kicked from the group.`,
        });
      }
    };

    const addNewMembersToGroupReceiver = async () => {
      setIsAddingNewMembersLoading(false);
      await refetchGroup(),
        toast({
          description: "New members have been added to the group.",
        });
    };

    const handleReadMessageReciever = (messageId: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.messageId === messageId ? { ...item, isRead: true } : item
        )
      );
    };

    const handleSetAsAdminReceiver = async (adminId: string) => {
      await refetchGroup();

      if (user?.userId === adminId) {
        toast({
          description: "You have been set as admin.",
        });
      }
    };

    socket?.on(SocketEvents.SEND_GROUP_MESSAGE, recieveMessage);
    socket?.emit(SocketEvents.JOIN_GROUP, { groupIds: [id] });
    socket.on(SocketEvents.DELETE_MESSAGE, deleteMessageReceiver);
    socket.on(SocketEvents.EXIT_GROUP, exitGroupReceiver);
    socket.on(SocketEvents.UPDATE_GROUP_DETAILS, updateGroupDetailsReceiver);
    socket.on(SocketEvents.KICK_MEMBER, kickMemberReceiver);
    socket.on(
      SocketEvents.ADD_NEW_MEMBER_TO_GROUP,
      addNewMembersToGroupReceiver
    );
    socket.on(SocketEvents.READ_MESSAGE, handleReadMessageReciever);
    socket.on(SocketEvents.SET_ADMIN, handleSetAsAdminReceiver);

    return () => {
      socket?.off(SocketEvents.SEND_GROUP_MESSAGE, recieveMessage);
      socket?.emit(SocketEvents.LEAVE_GROUP, { groupIds: [id] });
      socket.off(SocketEvents.DELETE_MESSAGE, recieveMessage);
      socket.off(SocketEvents.EXIT_GROUP, exitGroupReceiver);
      socket.off(SocketEvents.UPDATE_GROUP_DETAILS, updateGroupDetailsReceiver);
      socket.off(SocketEvents.KICK_MEMBER, kickMemberReceiver);
      socket.off(
        SocketEvents.ADD_NEW_MEMBER_TO_GROUP,
        addNewMembersToGroupReceiver
      );
      socket.off(SocketEvents.READ_MESSAGE, handleReadMessageReciever);
      socket.off(SocketEvents.SET_ADMIN, handleSetAsAdminReceiver);
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
    // check current size of cache in idb
    const cacheSize = await sizeOfMediaCacheIDB();
    // if cache size is greater than 10 MB, clear oldest media
    if (cacheSize > 10 * 1024 * 1024) {
      await clearOldestMediaCacheIDB();
    }
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

  const handleKickUserFromGroup = (userId: string) => {
    if (!socket) return;
    socket.emit(SocketEvents.KICK_MEMBER, {
      groupId: id,
      userId,
    });
  };

  const handleAddNewMembers = async (newMembers: string[]) => {
    if (!socket) return;

    setIsAddingNewMembersLoading(true);

    let encryptedChatKeyForUsers: Array<{
      userId: string;
      encryptedKey: string;
    }> = [];

    // Get symmetric key of the group from admin encrypted symmetric key
    const privateKey = await getValueFromStoreIDB(user?.userId!);
    if (!privateKey) return;

    const decryptedKey = await decryptSymetricKeyWithPrivateKey(
      encryptedChatKeyRef.current!,
      privateKey
    );
    if (!decryptedKey) return;

    const decryptedKeyAsArrayBuffer = await crypto.subtle.exportKey(
      "raw",
      decryptedKey
    );

    const membersPublicKeys = await getPublicKeysApi(newMembers);
    if (!membersPublicKeys || membersPublicKeys.length === 0) return;

    await Promise.all(
      membersPublicKeys.map(async (item) => {
        const encryptedChatKey = await encryptSymetricKeyWithPublicKey(
          decryptedKeyAsArrayBuffer,
          item.publicKey
        );

        const encryptedChatKeyBase64 = arrayBufferToBase64(encryptedChatKey);

        encryptedChatKeyForUsers.push({
          userId: item.userId,
          encryptedKey: encryptedChatKeyBase64,
        });
      })
    );

    socket.emit(SocketEvents.ADD_NEW_MEMBER_TO_GROUP, {
      groupId: id,
      members: encryptedChatKeyForUsers,
    });
  };

  const handleReadMessage = async (messageId: string) => {
    if (!socket) return;
    socket.emit(SocketEvents.READ_MESSAGE, {
      messageId,
    });
  };

  const handleSetAsAdmin = (userId: string) => {
    if (!socket) return;
    socket.emit(SocketEvents.SET_ADMIN, {
      groupId: id,
      userId,
    });
  };

  const handleDeleteGroup = () => {
    if (!socket) return;
    socket.emit(SocketEvents.DELETE_GROUP, {
      groupId: id,
    });
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
              handleKickUserFromGroup={handleKickUserFromGroup}
              handleAddNewMembers={handleAddNewMembers}
              isAddingNewMembersLoading={isAddingNewMembersLoading}
              handleSetAsAdmin={handleSetAsAdmin}
              handleDeleteGroup={handleDeleteGroup}
            />
            <ChatContent
              messages={messages}
              handleDeleteMsg={handleDeleteMsg}
              sendMessageLoading={sendMessageLoading}
              getMediaLoading={getMediaLoading}
              handleGetMedia={handleGetMedia}
              handleReadMessage={handleReadMessage}
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
