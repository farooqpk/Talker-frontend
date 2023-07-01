import { ReactElement } from "react";
import { BottomNavbar } from "../../components/common/bottomNavbar";
import { HomeSearchBox } from "../../components/home/homeSearchBox";
import { HomeList } from "../../components/home/homeList";
import { TopNavbar } from "../../components/common/topNavbar";

export const Home = (): ReactElement => {
  return (
    <>
      <main className="absolute inset-0 flex flex-col items-center justify-between">
        <header className="w-full">
          <div className="hidden md:block h-20 w-full">
            <TopNavbar />
          </div>
          <HomeSearchBox />
        </header>

        <section className="w-full flex flex-col gap-1 flex-grow overflow-y-auto max-h-[90vh] scroll-smooth mb-20 mt-3 md:mt-5 md:mb-4 md:items-center">
          <HomeList name="farooq" />
        </section>

        <footer className="md:hidden lg:hidden w-full">
          <BottomNavbar />
        </footer>
      </main>
    </>
  );
};
