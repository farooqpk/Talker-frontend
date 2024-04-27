import { useGetUser } from "@/hooks/user";
import Container from "../Container";
import { MessageType, User } from "../common/types";
import { formateDate } from "@/lib/format-date";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Props = {
  messages: MessageType[];
};

export const GroupChatContent = ({ messages }: Props) => {
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
          {messages?.map((msg, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-2 ${
                msg.senderId === user?.userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b">
                <h3 className="text-sm font-semibold">{`${
                  msg.senderId === user?.userId ? "You" : msg.sender?.username
                }`}</h3>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold">
                  {msg.contentForGroup}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs text-muted-foreground">
                  {formateDate(msg.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </section>
      </Container>
    </>
  );
};
