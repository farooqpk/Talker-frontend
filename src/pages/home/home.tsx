import HomeAddButton from "@/components/home/addButton";
import HomeHeader from "@/components/home/header";
import { HomeList } from "@/components/home/homeList";
import { ReactElement } from "react";
import { useQuery } from "react-query";

export const Home = (): ReactElement => {
  const {} = useQuery({
    queryKey: ["randomusersforsearch"],
    queryFn: () => {},
  });

  return (
    <>
      <main className="absolute inset-0 flex flex-col flex-wrap py-6 px-4 gap-8">
        <section className="mx-auto">
          <HomeHeader />
        </section>
        <section>
          <HomeList />
        </section>
        <section>
          <HomeAddButton />
        </section>
      </main>
    </>
  );
};
