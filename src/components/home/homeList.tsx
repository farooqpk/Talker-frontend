import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formateDate } from "@/lib/format-date";
import { truncateMessage } from "@/lib/trunctuate";
import Loader from "../loader";
import type { Chat } from "@/types";

export const HomeList = ({
  chatData,
  isTyping,
  isLoading,
}: {
  chatData: Chat[];
  isTyping: string[];
  isLoading: boolean;
}): ReactElement => {
  if (isLoading) {
    return <Loader />;
  }


  const chatList = () => {
    return <>
      {chatData?.map((chats: Chat, index: number) => {
        return (
          <div className="md:w-[60%] mx-auto" key={index}>
            {chats?.isGroup ? (
              <Link
                to={`/group/${chats?.Group?.[0]?.groupId}`}
                className="flex justify-between items-center p-3 hover:bg-slate-900 rounded-2xl "
              >
                <Avatar>
                  <AvatarFallback className="capitalize">
                    {chats?.Group?.[0]?.name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-lg font-medium">
                    {chats?.Group?.[0]?.name}
                  </h2>

                  <span className="text-muted-foreground text-sm">
                    {chats?.messages[0]?.isDeleted
                      ? truncateMessage("This message was deleted")
                      : truncateMessage(
                        chats?.messages[0]?.text ||
                        chats?.Group?.[0]?.description
                      )}
                  </span>
                </div>

                <span className="text-muted-foreground text-sm">
                  {formateDate(
                    chats?.messages[0]?.createdAt || chats?.createdAt
                  )}
                </span>
              </Link>
            ) : (
              <Link
                to={`/chat/${chats?.participants[0]?.user?.userId}`}
                className="flex justify-between items-center p-3 hover:bg-slate-900 rounded-2xl "
              >
                <Avatar>
                  <AvatarFallback className="capitalize">
                    {chats?.participants[0]?.user?.username[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-lg font-medium ">
                    {chats?.participants[0]?.user?.username}
                  </h2>
                  {isTyping.includes(chats?.participants[0]?.user?.userId) ? (
                    <span className="text-sm text-warning">Typing...</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {chats?.messages[0]?.isDeleted
                        ? truncateMessage("This message was deleted")
                        : truncateMessage(chats?.messages[0]?.text as string)}
                    </span>
                  )}
                </div>

                <span className="text-muted-foreground text-sm">
                  {formateDate(chats?.messages[0]?.createdAt)}
                </span>
              </Link>
            )}
          </div>
        );
      })}
    </>
  }

  const chatEmpty = () => {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground text-sm text-center">
        <span className="leading-7">Start a new chat by searching a user or creating a new group</span>
      </div>
    );
  }

  return (
    <section className="overflow-auto">
      {
        chatData.length > 0 ? chatList() : chatEmpty()
      }
    </section>
  );
};
