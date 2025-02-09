import {
  type Chat,
  ContentType,
  type MessageType,
  SocketEvents,
} from "@/types/index";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import { useGetUser } from "@/hooks/useGetUser";
import {
  decryptMessage,
  decryptSymetricKeyWithPrivateKey,
} from "@/lib/ecrypt_decrypt";
import { getChatListApi } from "@/services/api/chat";
import { useSocket } from "@/context/socketProvider";
import { type ReactElement, useEffect, useState } from "react";
import { useQuery } from "react-query";
import Options from "@/components/home/options";
import { useToast } from "@/components/ui/use-toast";
import { getValueFromStoreIDB } from "@/lib/idb";
import { decode as base64ToArrayBuffer } from "base64-arraybuffer";
import msgRecieveSound from "../../assets/Pocket.mp3";
import msgpack from "msgpack-lite";

export const Home = (): ReactElement => {
  const [chatData, setChatData] = useState<Chat[]>([]);
  const socket = useSocket();
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useGetUser();

  const { isLoading, refetch } = useQuery({
    queryKey: ["chatlist"],
    queryFn: getChatListApi,
    keepPreviousData: true,
    onSuccess: async (data: Chat[]) => {
      if (!data || !user) return;

      const privateKey = await getValueFromStoreIDB(user.userId);

      if (!privateKey) return;

      const decryptedDataPromises = data?.map(async (chat) => {
        const encryptedChatKey = chat?.encryptedKey;
        const encryptedChatKeyArrayBuffer =
          base64ToArrayBuffer(encryptedChatKey);

        if (
          chat?.message?.isDeleted ||
          chat?.message?.contentType !== ContentType.TEXT
        )
          return chat;

        const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
          encryptedChatKeyArrayBuffer,
          privateKey
        );

        const textArrayBuffer = base64ToArrayBuffer(
          chat.message?.content as string
        );

        chat.message.text = (await decryptMessage(
          textArrayBuffer,
          decryptedChatKey,
          ContentType.TEXT
        )) as string;
        return chat;
      });

      const decryptedData = await Promise.all(decryptedDataPromises);
      setChatData(decryptedData);
    },
  });

  useEffect(() => {
    if (!socket || !user) return;

    const groupIds = chatData
      ?.filter((item: Chat) => item?.isGroup === true)
      ?.map((item: Chat) => item?.group?.groupId);

    const handleIsTyping = (userId: string) => {
      setIsTyping((prev) => [...prev, userId]);
    };

    const handleIsNotTyping = (userId: string) => {
      setIsTyping(isTyping.filter((id) => id !== userId));
    };

    const handleRecieveMessage = async (data: Buffer) => {
      const decoded = msgpack.decode(new Uint8Array(data));
      const { message, isRefetchChatList } = decoded as {
        message: MessageType;
        isRefetchChatList?: boolean;
      };
      if (isRefetchChatList) {
        refetch();
        return;
      }

      const chat = chatData?.find((item) => item?.chatId === message?.chatId);

      if (message.content && message.contentType === ContentType.TEXT) {
        const privateKey = await getValueFromStoreIDB(user.userId);
        const encryptedChatKey = chat?.encryptedKey;
        if (!encryptedChatKey) return;

        const encryptedChatKeyArrayBuffer =
          base64ToArrayBuffer(encryptedChatKey);

        const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
          encryptedChatKeyArrayBuffer,
          privateKey
        );

        const textArrayBuffer = base64ToArrayBuffer(message?.content);

        message.text = (await decryptMessage(
          textArrayBuffer,
          decryptedChatKey,
          ContentType.TEXT
        )) as string;
      }

      setChatData((prev) => {
        if (chat) {
          const index = prev?.indexOf(chat);
          prev[index] = { ...chat, message };
        }
        return [...prev];
      });

      new Audio(msgRecieveSound).play();
    };

    const handleDeleteMessage = (messageId: string) => {
      const chat = chatData?.find(
        (item) => item?.message?.messageId === messageId
      );

      if (!chat) return;
      setChatData((prev) => {
        const index = prev?.indexOf(chat);
        prev[index] = {
          ...chat,
          message: { ...chat?.message, isDeleted: true },
        };

        return [...prev];
      });
    };

    const handleGroupCreated = () => {
      refetch();
      toast({
        title: "You were added to a new group",
      });
    };

    const kickMemberReceiver = (data: ArrayBuffer) => {
      const { removedUserId, chatId, groupName } = msgpack.decode(
        new Uint8Array(data)
      ) as {
        removedUserId: string;
        chatId: string;
        groupName: string;
      };
      if (removedUserId === user?.userId) {
        setChatData((prev) => {
          const updatedChatData = prev.filter(
            (item) => item?.chatId !== chatId
          );
          return updatedChatData;
        });
        toast({
          title: `You were removed from group '${groupName}'`,
        });
      }
    };

    const handleDeleteGroupReceiver = async (data: Buffer) => {
      const { groupName, chatId } = msgpack.decode(new Uint8Array(data)) as {
        groupName: string;
        chatId: string;
      };

      setChatData((prev) => {
        const updatedChatData = prev.filter((item) => item?.chatId !== chatId);
        return updatedChatData;
      });
      toast({
        title: `Group '${groupName}' was deleted by admin.`,
      });
    };

    socket?.emit(SocketEvents.JOIN_GROUP, msgpack.encode({ groupIds }));

    socket?.on(SocketEvents.IS_TYPING, handleIsTyping);

    socket?.on(SocketEvents.IS_NOT_TYPING, handleIsNotTyping);

    socket?.on(SocketEvents.SEND_GROUP_MESSAGE, handleRecieveMessage);

    socket?.on(SocketEvents.SEND_PRIVATE_MESSAGE, handleRecieveMessage);

    socket?.on(SocketEvents.DELETE_MESSAGE, handleDeleteMessage);

    socket?.on(SocketEvents.GROUP_CREATED, handleGroupCreated);

    socket.on(SocketEvents.KICK_MEMBER, kickMemberReceiver);

    socket?.on(SocketEvents.DELETE_GROUP, handleDeleteGroupReceiver);

    return () => {
      socket?.off(SocketEvents.IS_TYPING, handleIsTyping);

      socket?.off(SocketEvents.IS_NOT_TYPING, handleIsNotTyping);

      socket?.off(SocketEvents.SEND_GROUP_MESSAGE, handleRecieveMessage);

      socket?.off(SocketEvents.SEND_PRIVATE_MESSAGE, handleRecieveMessage);

      socket?.emit(SocketEvents.LEAVE_GROUP, msgpack.encode({ groupIds }));

      socket?.off(SocketEvents.DELETE_MESSAGE, handleDeleteMessage);

      socket?.off(SocketEvents.GROUP_CREATED, handleGroupCreated);

      socket.off(SocketEvents.KICK_MEMBER, kickMemberReceiver);

      socket?.off(SocketEvents.DELETE_GROUP, handleDeleteGroupReceiver);
    };
  }, [socket, chatData, user, isTyping]);

  return (
    <main className="h-[calc(100dvh)] flex flex-col py-6 px-4 gap-8">
      <HomeHeader />
      <HomeList chatData={chatData} isTyping={isTyping} isLoading={isLoading} />
      <Options />
    </main>
  );
};
