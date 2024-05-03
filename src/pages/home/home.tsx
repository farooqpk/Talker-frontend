import { MessageType } from "@/components/common/types";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import Loader from "@/components/loader";
import { useGetUser } from "@/hooks/user";
import { decryptMessage } from "@/lib/ecrypt_decrypt";
import { getChatListApi } from "@/services/api/chat";
import { useSocket } from "@/context/socketProvider";
import { ReactElement, useEffect, useState } from "react";
import { useQuery } from "react-query";
import CreateGroup from "@/components/home/createGroup";

export const Home = (): ReactElement => {
  const [chatData, setChatData] = useState<any[]>([]);
  const { user, privateKey } = useGetUser();
  const socket = useSocket();
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [decryptLoading, setDecryptLoading] = useState<boolean>(false);

  const { isLoading, refetch } = useQuery({
    queryKey: ["chatlist"],
    queryFn: getChatListApi,
    onSuccess: async (data) => {
      const personalChats = data.filter((item: any) => item?.isGroup === false);
      const groupChats = data.filter((item: any) => item?.isGroup === true);

      setDecryptLoading(true);
      const decryptedPersonalData = await Promise.all(
        personalChats.map(async (chat: any) => {
          if (user?.userId === chat?.messages[0]?.senderId) {
            chat.messages[0]?.contentType === "TEXT"
              ? (chat.messages[0].contentForSender = await decryptMessage(
                  chat.messages[0].contentForSender,
                  chat.messages[0].encryptedSymetricKeyForSender,
                  localStorage.getItem("privateKey")!,
                  false
                ))
              : (chat.messages[0].contentForSender = "AUDIO");
          } else {
            chat.messages[0]?.contentType === "TEXT"
              ? (chat.messages[0].contentForRecipient = await decryptMessage(
                  chat.messages[0].contentForRecipient,
                  chat.messages[0].encryptedSymetricKeyForRecipient,
                  localStorage.getItem("privateKey")!,
                  false
                ))
              : (chat.messages[0].contentForRecipient = "AUDIO");
          }
          return chat;
        })
      );

      const decryptedGroupData = await Promise.all(
        groupChats?.map(async (chat: any) => {
          if (chat?.messages?.[0]) {
            if (chat?.messages?.[0]?.contentType === "TEXT") {
              chat.messages[0].contentForGroup = await decryptMessage(
                chat.messages[0].contentForGroup,
                chat.Group[0].GroupKey[0].encryptedGroupKey,
                privateKey!,
                false
              );
            } else {
              chat.messages[0].contentForGroup = "AUDIO";
            }
          }
          return chat;
        })
      );

      setDecryptLoading(false);
      setChatData([...decryptedPersonalData, ...decryptedGroupData]);
    },
  });

  // to update latest message in the home
  useEffect(() => {
    const groupIds = chatData
      ?.filter((item: any) => item?.isGroup === true)
      ?.map((item: any) => item?.Group[0]?.groupId);

    const handleIsTyping = (userId: string) => {
      setIsTyping((prev) => [...prev, userId]);
    };

    const handleIsNotTyping = (userId: string) => {
      setIsTyping(isTyping.filter((id) => id !== userId));
    };

    const handleRecieveMessageGroup = async (message: MessageType) => {
      const encryptedGroupKey = chatData?.find(
        (item) => item?.isGroup === true && item?.chatId === message?.chatId
      )?.Group[0]?.GroupKey[0]?.encryptedGroupKey;

      if (message.contentType === "TEXT") {
        message.contentForGroup = await decryptMessage(
          message?.contentForGroup!,
          encryptedGroupKey!,
          privateKey!,
          false
        );
      } else {
        message.contentForGroup = "AUDIO";
      }

      setChatData((prev) => {
        const chat = prev?.find((item) => item.chatId === message.chatId);
        if (chat) {
          const index = prev?.indexOf(chat);
          prev[index] = { ...chat, messages: [message] };
        }
        return [...prev];
      });
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
      if (user?.userId === message.senderId) {
        message.contentType === "TEXT"
          ? (message.contentForSender = await decryptMessage(
              message?.contentForSender!,
              message?.encryptedSymetricKeyForSender!,
              privateKey!,
              false
            ))
          : (message.contentForSender = "AUDIO");
      } else {
        message.contentType === "TEXT"
          ? (message.contentForRecipient = await decryptMessage(
              message?.contentForRecipient!,
              message?.encryptedSymetricKeyForRecipient!,
              localStorage.getItem("privateKey")!,
              false
            ))
          : (message.contentForRecipient = "AUDIO");
      }

      setChatData((prev) => {
        const chat = prev?.find((item) => item.chatId === message.chatId);
        if (chat) {
          const index = prev?.indexOf(chat);
          prev[index] = { ...chat, messages: [message] };
        }
        return [...prev];
      });
    };

    socket?.emit("joinGroup", { groupIds });

    socket?.on("isTyping", handleIsTyping);

    socket?.on("isNotTyping", handleIsNotTyping);

    socket?.on("sendMessageForGroup", handleRecieveMessageGroup);

    socket?.on("sendMessage", handleRecieveMessage);

    return () => {
      socket?.off("isTyping", handleIsTyping);

      socket?.off("isNotTyping", handleIsNotTyping);

      socket?.off("sendMessageForGroup", handleRecieveMessageGroup);

      socket?.off("sendMessage", handleRecieveMessage);

      socket?.emit("leaveGroup", { groupIds });
    };
  }, [socket, chatData]);

  return (
    <>
      <main className="absolute inset-0 flex flex-col py-6 px-4 gap-8">
        {isLoading || decryptLoading ? (
          <Loader />
        ) : (
          <>
            <section className="mx-auto">
              <HomeHeader />
            </section>

            <section>
              <HomeList data={chatData} isTyping={isTyping} />
            </section>

            <section>
              <CreateGroup />
            </section>
          </>
        )}
      </main>
    </>
  );
};
