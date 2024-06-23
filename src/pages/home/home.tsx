import { ContentType, MessageType, SocketEvents } from "@/types/index";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import { useGetUser } from "@/hooks/useGetUser";
import {
  decryptMessage,
  decryptSymetricKeyWithPrivateKey,
} from "@/lib/ecrypt_decrypt";
import { getChatListApi } from "@/services/api/chat";
import { useSocket } from "@/context/socketProvider";
import { ReactElement, useEffect, useState } from "react";
import { useQuery } from "react-query";
import Options from "@/components/home/options";
import { useToast } from "@/components/ui/use-toast";
import { getValueFromStoreIDB } from "@/lib/idb";
import { decode as base64ToArrayBuffer } from "base64-arraybuffer";

export const Home = (): ReactElement => {
  const [chatData, setChatData] = useState<any[]>([]);
  const socket = useSocket();
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useGetUser();

  const { isLoading, refetch } = useQuery({
    queryKey: ["chatlist"],
    queryFn: getChatListApi,
    keepPreviousData: true,
    onSuccess: async (data) => {
      if (!data || !user) return;

      const privateKey = await getValueFromStoreIDB(user.userId);

      if (!privateKey) return;

      const decryptedDataPromises = data?.map(async (chat: any) => {
        const encryptedChatKey = chat?.ChatKey[0]?.encryptedKey;
        const encryptedChatKeyArrayBuffer =
          base64ToArrayBuffer(encryptedChatKey);

        if (chat?.messages?.[0] && !chat.messages[0].isDeleted) {
          switch (chat.messages[0].contentType) {
            case ContentType.TEXT:
              const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
                encryptedChatKeyArrayBuffer,
                privateKey
              );

              const textArrayBuffer = base64ToArrayBuffer(
                chat.messages[0].content
              );

              chat.messages[0].text = (await decryptMessage(
                textArrayBuffer,
                decryptedChatKey,
                ContentType.TEXT
              )) as string;

              break;

            case ContentType.AUDIO:
              chat.messages[0].text = "audio...";
              break;

            case ContentType.IMAGE:
              chat.messages[0].text = "image...";
              break;

            default:
              break;
          }
        }
        return chat;
      });

      const decryptedData = await Promise.all(decryptedDataPromises);
      setChatData(decryptedData);
    },
  });

  // to update latest message in the home
  useEffect(() => {
    if (!socket || !user) return;

    const groupIds = chatData
      ?.filter((item: any) => item?.isGroup === true)
      ?.map((item: any) => item?.Group[0]?.groupId);

    const handleIsTyping = (userId: string) => {
      setIsTyping((prev) => [...prev, userId]);
    };

    const handleIsNotTyping = (userId: string) => {
      setIsTyping(isTyping.filter((id) => id !== userId));
    };

    const handleRecieveMessage = async ({
      message,
      isRefetchChatList,
    }: {
      message: MessageType;
      isRefetchChatList?: boolean;
    }) => {
      if (isRefetchChatList) {
        refetch();
        return;
      }

      const chat = chatData?.find((item) => item?.chatId === message?.chatId);

      switch (message.contentType) {
        case ContentType.TEXT:
          const privateKey = await getValueFromStoreIDB(user.userId);
          const encryptedChatKey = chat?.ChatKey[0]?.encryptedKey;

          const encryptedChatKeyArrayBuffer =
            base64ToArrayBuffer(encryptedChatKey);

          const decryptedChatKey = await decryptSymetricKeyWithPrivateKey(
            encryptedChatKeyArrayBuffer,
            privateKey
          );

          const textArrayBuffer = base64ToArrayBuffer(message?.content!);

          message.text = (await decryptMessage(
            textArrayBuffer,
            decryptedChatKey,
            ContentType.TEXT
          )) as string;
          break;

        case ContentType.AUDIO:
          message.text = "audio...";
          break;

        case ContentType.IMAGE:
          message.text = "image...";
          break;

        default:
          break;
      }

      setChatData((prev) => {
        if (chat) {
          const index = prev?.indexOf(chat);
          prev[index] = { ...chat, messages: [message] };
        }
        return [...prev];
      });
    };

    const handleDeleteMessage = (messageId: string) => {
      const chat = chatData?.find(
        (item) => item?.messages?.[0]?.messageId === messageId
      );

      if (!chat) return;
      setChatData((prev) => {
        const index = prev?.indexOf(chat);
        prev[index] = {
          ...chat,
          messages: [{ ...chat?.messages[0], isDeleted: true }],
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

    const handleExitGroup = ({
      groupId,
      isExitByAdmin,
    }: {
      groupId: string;
      isExitByAdmin: boolean;
    }) => {
      if (isExitByAdmin) {
        socket?.emit(SocketEvents.LEAVE_GROUP, { groupIds: [groupId] });
        setChatData((prev) =>
          prev.filter((item) => item?.Group?.[0]?.groupId !== groupId)
        );
      }
    };

    socket?.emit(SocketEvents.JOIN_GROUP, { groupIds });

    socket?.on(SocketEvents.IS_TYPING, handleIsTyping);

    socket?.on(SocketEvents.IS_NOT_TYPING, handleIsNotTyping);

    socket?.on(SocketEvents.SEND_GROUP_MESSAGE, handleRecieveMessage);

    socket?.on(SocketEvents.SEND_PRIVATE_MESSAGE, handleRecieveMessage);

    socket?.on(SocketEvents.DELETE_MESSAGE, handleDeleteMessage);

    socket?.on(SocketEvents.GROUP_CREATED, handleGroupCreated);

    socket.on(SocketEvents.EXIT_GROUP, handleExitGroup);

    return () => {
      socket?.off(SocketEvents.IS_TYPING, handleIsTyping);

      socket?.off(SocketEvents.IS_NOT_TYPING, handleIsNotTyping);

      socket?.off(SocketEvents.SEND_GROUP_MESSAGE, handleRecieveMessage);

      socket?.off(SocketEvents.SEND_PRIVATE_MESSAGE, handleRecieveMessage);

      socket?.emit(SocketEvents.LEAVE_GROUP, { groupIds });

      socket?.off(SocketEvents.DELETE_MESSAGE, handleDeleteMessage);

      socket?.off(SocketEvents.GROUP_CREATED, handleGroupCreated);

      socket.off(SocketEvents.EXIT_GROUP, handleExitGroup);
    };
  }, [socket, chatData, user]);

  return (
    <main className="h-[calc(100dvh)] flex flex-col py-6 px-4 gap-8">
      <HomeHeader />
      <HomeList chatData={chatData} isTyping={isTyping} isLoading={isLoading} />
      <Options />
    </main>
  );
};
