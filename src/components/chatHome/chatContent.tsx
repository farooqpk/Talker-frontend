import { useGetUser } from "@/hooks/user";
import Container from "../Container";
import { MessageType, User } from "../common/types";
import { formateDate } from "@/lib/format-date";

type Props = {
  messages: MessageType[];
  user: User;
};

export const ChatContent = ({ messages, user: sender }: Props) => {
  const { user } = useGetUser();
  return (
    <>
      <Container>
        <section className="flex flex-col gap-4 h-[67vh] md:h-[65vh] overflow-y-scroll px-10 py-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-2 ${
                message.senderId === user?.userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b">
                <h3 className="text-sm font-semibold">
                  {message.senderId === sender.userId ? sender.username : "You"}
                </h3>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold">
                  {message.content}
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
