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
  const { user } = useGetUser();
  const socket = useSocket();
  const [latestMessage, setLatestMessage] = useState<MessageType | null>(null);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [decryptLoading, setDecryptLoading] = useState<boolean>(false);

  const { isLoading, refetch } = useQuery({
    queryKey: ["chatlist"],
    queryFn: getChatListApi,
    onSuccess: async (data) => {
      setDecryptLoading(true);
      const decryptedData = await Promise.all(
        data.map(async (chat: any) => {
          if (user?.userId === chat?.messages[0]?.senderId) {
            chat.messages[0].contentType === "TEXT"
              ? (chat.messages[0].contentForSender = await decryptMessage(
                  chat.messages[0].contentForSender,
                  chat.messages[0].encryptedSymetricKeyForSender,
                  localStorage.getItem("privateKey")!,
                  false
                ))
              : (chat.messages[0].contentForSender = "AUDIO");
          } else {
            chat.messages[0].contentType === "TEXT"
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

      setDecryptLoading(false);
      setChatData(decryptedData);
    },
  });

  // to update latest message in the home
  useEffect(() => {
    const handleUpdateChatList = async ({
      isRefetchChatList,
      message,
    }: {
      isRefetchChatList: boolean;
      message?: MessageType;
    }) => {
      if (isRefetchChatList) {
        await refetch();
      } else {
        if (!message) return;
        if (user?.userId === message?.senderId) {
          message.contentType === "TEXT"
            ? (message.contentForSender = await decryptMessage(
                message.contentForSender,
                message.encryptedSymetricKeyForSender,
                localStorage.getItem("privateKey")!,
                false
              ))
            : (message.contentForSender = "AUDIO");
        } else {
          message.contentType === "TEXT"
            ? (message.contentForRecipient = await decryptMessage(
                message.contentForRecipient,
                message.encryptedSymetricKeyForRecipient,
                localStorage.getItem("privateKey")!,
                false
              ))
            : (message.contentForRecipient = "AUDIO");
        }
        setLatestMessage(message);
      }
    };

    const handleIsTyping = (userId: string) => {
      setIsTyping((prev) => [...prev, userId]);
    };

    const handleIsNotTyping = (userId: string) => {
      setIsTyping(isTyping.filter((id) => id !== userId));
    };

    socket?.on("updateChatList", handleUpdateChatList);

    socket?.on("isTyping", handleIsTyping);

    socket?.on("isNotTyping", handleIsNotTyping);

    return () => {
      socket?.off("updateChatList", handleUpdateChatList);

      socket?.off("isTyping", handleIsTyping);

      socket?.off("isNotTyping", handleIsNotTyping);
    };
  }, [socket]);

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
              <HomeList
                data={chatData}
                latestMessage={latestMessage}
                isTyping={isTyping}
              />
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
