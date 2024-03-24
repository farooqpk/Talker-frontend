import HomeAddButton from "@/components/home/addButton";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import Loader from "@/components/loader";
import { useGetUser } from "@/hooks/user";
import { decrypt } from "@/lib/ecrypt_decrypt";
import { getChatListApi } from "@/services/api/chat";
import { ReactElement, useState } from "react";
import { useQuery } from "react-query";

export const Home = (): ReactElement => {
  const [chatData, setChatData] = useState<any[]>([]);
  const { user } = useGetUser();

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
              <HomeList data={chatData} />
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
