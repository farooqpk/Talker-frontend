import { MessageType } from "@/types/index";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import { useGetUser } from "@/hooks/useGetUser";
import { decryptMessage } from "@/lib/ecrypt_decrypt";
import { getChatListApi } from "@/services/api/chat";
import { useSocket } from "@/context/socketProvider";
import { ReactElement, useEffect, useState } from "react";
import { useQuery } from "react-query";
import Options from "@/components/home/options";
import { useToast } from "@/components/ui/use-toast";
import { getValueFromStoreIDB } from "@/lib/idb";

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

      const decryptedDataPromises = data?.map(async (chat: any) => {
        const encryptedChatKey = chat?.ChatKey[0]?.encryptedKey;
        if (chat?.messages?.[0] && !chat.messages[0].isDeleted) {
          if (chat.messages[0].contentType === "TEXT") {
            chat.messages[0].content = await decryptMessage(
              chat.messages[0].content,
              encryptedChatKey,
              privateKey!,
              "TEXT"
            );
          } else if (chat.messages[0].contentType === "AUDIO") {
            chat.messages[0].content = "audio...";
          } else if (chat.messages[0].contentType === "IMAGE") {
            chat.messages[0].content = "image...";
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
      const encryptedChatKey = chat?.ChatKey[0]?.encryptedKey;
      const privateKey = await getValueFromStoreIDB(user.userId);

      if (message.contentType === "TEXT") {
        message.content = await decryptMessage(
          message?.content!,
          encryptedChatKey!,
          privateKey!,
          "TEXT"
        );
      } else if (message.contentType === "AUDIO") {
        message.content = "audio...";
      } else if (message.contentType === "IMAGE") {
        message.content = "image...";
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
        socket?.emit("leaveGroup", { groupIds: [groupId] });
        setChatData((prev) =>
          prev.filter((item) => item?.Group?.[0]?.groupId !== groupId)
        );
      }
    };

    socket?.emit("joinGroup", { groupIds });

    socket?.on("isTyping", handleIsTyping);

    socket?.on("isNotTyping", handleIsNotTyping);

    socket?.on("sendMessageForGroup", handleRecieveMessage);

    socket?.on("sendPrivateMessage", handleRecieveMessage);

    socket?.on("deleteMessage", handleDeleteMessage);

    socket?.on("groupCreated", handleGroupCreated);

    socket.on("exitGroup", handleExitGroup);

    return () => {
      socket?.off("isTyping", handleIsTyping);

      socket?.off("isNotTyping", handleIsNotTyping);

      socket?.off("sendMessageForGroup", handleRecieveMessage);

      socket?.off("sendPrivateMessage", handleRecieveMessage);

      socket?.emit("leaveGroup", { groupIds });

      socket?.off("deleteMessage", handleDeleteMessage);

      socket?.off("groupCreated", handleGroupCreated);

      socket.off("exitGroup", handleExitGroup);
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
