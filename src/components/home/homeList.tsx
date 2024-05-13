import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formateDate } from "@/lib/format-date";
import { truncateMessage } from "@/lib/trunctuate";

export const HomeList = ({
  chatData,
  isTyping,
}: {
  chatData: any;
  isTyping: string[];
}): ReactElement => {
  return (
    <>
      {chatData?.map((chats: any, index: number) => {
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
                  <h2 className="text-lg md:text-xl font-semibold">
                    {chats?.Group?.[0]?.name}
                  </h2>

                  <span className="text-muted-foreground text-sm md:text-lg">
                    {chats?.messages[0]?.isDeleted
                      ? "This message was deleted"
                      : truncateMessage(
                          chats?.messages[0]?.content ||
                            chats?.Group?.[0]?.description
                        )}
                  </span>
                </div>

                <span className="text-muted-foreground text-sm md:text-lg">
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
                  <h2 className="text-lg md:text-xl font-semibold ">
                    {chats?.participants[0]?.user?.username}
                  </h2>
                  {isTyping.includes(chats?.participants[0]?.user?.userId) ? (
                    <span className="text-sm text-warning">
                      Typing...
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm md:text-lg">
                      {chats?.messages[0]?.isDeleted
                        ? "This message was deleted"
                        : truncateMessage(chats?.messages[0]?.content)}
                    </span>
                  )}
                </div>

                <span className="text-muted-foreground text-sm md:text-lg">
                  {formateDate(chats?.messages[0]?.createdAt)}
                </span>
              </Link>
            )}
          </div>
        );
      })}
    </>
  );
};
