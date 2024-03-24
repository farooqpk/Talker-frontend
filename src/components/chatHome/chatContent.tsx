import { useGetUser } from "@/hooks/user";
import Container from "../Container";
import { MessageType, User } from "../common/types";
import { formateDate } from "@/lib/format-date";
import { useEffect, useRef } from "react";

type Props = {
  messages: MessageType[];
  recipient: User;
};

export const ChatContent = ({ messages, recipient }: Props) => {
  const { user } = useGetUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <Container>
        <section
          ref={scrollRef}
          className="flex flex-col gap-4 h-[67vh] md:h-[65vh] overflow-y-scroll px-3 md:px-14 py-4"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-2 ${
                message.senderId === user?.userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b">
                <h3 className="text-sm font-semibold">
                  {message.senderId === recipient.userId
                    ? recipient.username
                    : "You"}
                </h3>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold">
                  {message.senderId === recipient.userId
                    ? message.contentForRecipient
                    : message.contentForSender}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs text-muted-foreground">
                  {formateDate(message.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </section>
      </Container>
    </>
  );
};
