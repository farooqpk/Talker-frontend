import { ReactElement } from "react";
import { HomeFooter } from "../../components/home/homeFooter";
import { HomeHeader } from "../../components/home/homeHeader";
import { HomeList } from "../../components/home/homeList";

export const Home = (): ReactElement => {
  return (
    <>
      <main className="absolute inset-0 flex flex-col items-center justify-between">
        <header className="w-full">
          <HomeHeader />
        </header>
        <section className="w-full flex flex-col gap-1 flex-grow overflow-y-auto max-h-[90vh] scroll-smooth mb-20 md:mb-4">
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
          <HomeList name="manu" />
          <HomeList name="farooq" />
          <HomeList name="ishu" />
          <HomeList name="manu" />
        </section>

        <footer className="md:hidden lg:hidden w-full">
          <HomeFooter />
        </footer>
        
      </main>
    </>
  );
};
