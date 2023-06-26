import { HomeFooter } from "../../components/home/homeFooter";
import { HomeHeader } from "../../components/home/homeHeader";
import { HomeList } from "../../components/home/homeList";

export const Home = () => {
  return (
    <>
      <main className="absolute inset-0 flex flex-col items-center flex-wrap justify-between">
        <header className="w-full md:w-[50%]">
          <HomeHeader />
        </header>
        <section className="bg-red-400 w-full">
          <HomeList />
        </section>
        <footer className="bg-cyan-400 w-full">
          <HomeFooter />
        </footer>
      </main>
    </>
  );  
};
