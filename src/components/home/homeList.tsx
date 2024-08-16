import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formateDate } from "@/lib/format-date";
import { truncateMessage } from "@/lib/trunctuate";
import Loader from "../loader";
import { ContentType, type Chat } from "@/types";
import { useGetUser } from "@/hooks/useGetUser";
import { Camera, Mic } from "lucide-react";

export const HomeList = ({
  chatData,
  isTyping,
  isLoading,
}: {
  chatData: Chat[];
  isTyping: string[];
  isLoading: boolean;
}): ReactElement => {
  const { user } = useGetUser();
  if (isLoading) {
    return <Loader />;
  }

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const isGroup = chat.isGroup;
    const name = isGroup ? chat.group?.name : chat.recipient?.username;
    const avatar = name?.[0].toUpperCase();
    const link = isGroup
      ? `/group/${chat.group?.groupId}`
      : `/chat/${chat.recipient?.userId}`;
    const date = formateDate(chat.message?.createdAt || chat.createdAt);
    const isUserTyping = !isGroup && isTyping.includes(chat.recipient?.userId);
    const senderName =
      chat?.message?.senderId === user?.userId
        ? "You"
        : chat?.message?.sender?.username;
    const contentType = chat.message?.contentType;
    const isDeleted = chat.message?.isDeleted;
    const textContent = truncateMessage(chat.message?.text || "");
    const description = isGroup ? chat.group?.description : null;

    let content: ReactElement | string = "";
    if (contentType === ContentType.TEXT) {
      content = textContent || "Sent an empty message";
    } else if (contentType === ContentType.IMAGE) {
      content = <Camera className="w-5 h-4" />;
    } else if (contentType === ContentType.AUDIO) {
      content = <Mic className="w-5 h-4" />;
    }

    return (
      <Link
        to={link}
        className="flex items-center gap-2 p-4 hover:bg-slate-900 rounded-xl transition-colors duration-200"
      >
        <Avatar className="h-12 w-12 mr-4">
          <AvatarFallback className="text-lg font-semibold">
            {avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h2 className="text-lg font-medium truncate">{name}</h2>
          <div
            className={`text-sm ${
              isUserTyping ? "text-warning" : "text-muted-foreground"
            } truncate mt-1`}
          >
            {isUserTyping ? (
              "typing..."
            ) : isDeleted ? (
              "This message was deleted"
            ) : isGroup && !content ? (
              description
            ) : (
              <p className="flex items-center">
                {senderName}: {content}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
          {date}
        </span>
      </Link>
    );
  };

  return (
    <section className="overflow-auto h-full">
      {chatData.length > 0 ? (
        <div className="md:w-[50%] mx-auto">
          {chatData.map((chat) => (
            <ChatItem key={chat.chatId} chat={chat} />
          ))}
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
