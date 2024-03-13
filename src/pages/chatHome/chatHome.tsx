import { ReactElement } from "react";
// import { ChatContent } from "../../components/chatHome/chatContent";
// import { ChatFooter } from "../../components/chatHome/chatFooter";
// import { ChatHeader } from "../../components/chatHome/chatHeader";

export const ChatHome = (): ReactElement => {
  return (
    <>
      <main className="absolute inset-0 flex flex-col flex-wrap">

        <h1>welocome to chat</h1>
        {/* <section className="h-[12%] md:flex md:justify-center">
          <ChatHeader />
        </section>
        <section className="max-h-[78%] md:flex md:justify-center flex-1 overflow-y-auto scroll-smooth my-5 md:my-10 mx-3">
          <ChatContent />
        </section>
        <section className="h-[10%] flex justify-center mx-1">
          <ChatFooter />
        </section> */}
      </main>
    </>
  );
};
