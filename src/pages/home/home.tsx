import { MessageType } from "@/components/common/types";
import HomeAddButton from "@/components/home/addButton";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import Loader from "@/components/loader";
import { useGetUser } from "@/hooks/user";
import { decrypt } from "@/lib/ecrypt_decrypt";
import { getChatListApi } from "@/services/api/chat";
import { useSocket } from "@/socket/socketProvider";
import { ReactElement, useEffect, useState } from "react";
import { useQuery } from "react-query";

export const Home = (): ReactElement => {
  const [chatData, setChatData] = useState<any[]>([]);
  const { user } = useGetUser();
  const socket = useSocket();
  const [latestMessage, setLatestMessage] = useState<MessageType | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["chatlist"],
    queryFn: getChatListApi,
    onSuccess: async (data) => {
      const decryptedData = await Promise.all(
        data.map(async (chat: any) => {
          if (user?.userId === chat?.messages[0]?.senderId) {
            chat.messages[0].contentForSender = await decrypt(
              chat.messages[0].contentForSender
            );
          } else {
            chat.messages[0].contentForRecipient = await decrypt(
              chat.messages[0].contentForRecipient
            );
          }
          return chat;
        })
      );
      setChatData(decryptedData);
    },
  });

  // to update latest message in the home
  useEffect(() => {
    const handleRecieveMessage = async (data: MessageType) => {
      if (user?.userId === data.senderId) {
        data.contentForSender = await decrypt(data.contentForSender);
      } else {
        data.contentForRecipient = await decrypt(data.contentForRecipient);
      }
      setLatestMessage(data);
    };

    socket?.on("sendMessage", handleRecieveMessage);
    return () => {
      socket?.off("sendMessage", handleRecieveMessage);
    };
  }, [socket]);

  return (
    <>
      <main className="absolute inset-0 flex flex-col flex-wrap py-6 px-4 gap-8">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <section className="mx-auto">
              <HomeHeader />
            </section>
            <section>
              <HomeList data={chatData} latestMessage={latestMessage} />
            </section>
            <section>
              <HomeAddButton />
            </section>
          </>
        )}
      </main>
    </>
  );
};
