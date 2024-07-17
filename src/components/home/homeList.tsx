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

  const ChatItem = ({ chat }: { chat: Chat }) => {

    const isGroup = chat.isGroup;
    const name = isGroup ? chat.Group?.[0]?.name : chat.participants[0]?.user?.username;
    const avatar = name?.[0].toUpperCase();
    const link = isGroup ? `/group/${chat.Group?.[0]?.groupId}` : `/chat/${chat.participants[0]?.user?.userId}`;
    const message = chat.messages[0]?.isDeleted
      ? "This message was deleted"
      : chat.messages[0]?.text || (isGroup && chat.Group?.[0]?.description);
    const date = formateDate(chat.messages[0]?.createdAt || chat.createdAt);
    const isUserTyping = !isGroup && isTyping.includes(chat.participants[0]?.user?.userId);

    return (
      <Link to={link} className="flex items-center gap-2 p-4 hover:bg-slate-900 rounded-xl transition-colors duration-200">
        <Avatar className="h-12 w-12 mr-4">
          <AvatarFallback className="text-lg font-semibold">{avatar}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h2 className="text-lg font-medium truncate">{name}</h2>
          <span className={`text-sm ${isUserTyping ? 'text-warning' : 'text-muted-foreground'} truncate`}>
            {isUserTyping ? "Typing..." : truncateMessage(message || "")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">{date}</span>
      </Link>
    )
  };


  return (
    <section className="overflow-auto h-full">
      {chatData.length > 0 ? (
        <div className="md:w-[50%] mx-auto">
          {
            chatData.map((chat, index) => <ChatItem key={index} chat={chat} />)
          }
        </div>

      ) : (
        <div className="flex justify-center h-full text-muted-foreground text-sm text-center">
          <span className="leading-7">
            Start a new chat by searching a user or creating a new group
          </span>
        </div>
      )}
    </section>
  );
};
