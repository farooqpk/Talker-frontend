import HomeAddButton from "@/components/home/addButton";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import Loader from "@/components/loader";
import { getChatListApi } from "@/services/api/chat";
import { ReactElement } from "react";
import { useQuery } from "react-query";

export const Home = (): ReactElement => {
  const { data, isLoading } = useQuery({
    queryKey: ["chatlist"],
    queryFn: getChatListApi,
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
              <HomeList data={data} />
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
