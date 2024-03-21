import { useGetUser } from "@/hooks/user";
import Container from "../Container";
import { MessageType } from "../common/types";

export const ChatContent = ({ messages }: { messages: MessageType[] }) => {
  const { user } = useGetUser();
  return (
    <>
      <Container>
        <section className="flex flex-col gap-4 max-h-[67vh] md:max-h-[65vh] overflow-y-scroll px-10 py-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-2 ${
                message.senderId === user?.userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b">
                <h3 className="text-sm font-semibold">John</h3>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {message.content}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs">{message.createdAt}</span>
              </div>
            </div>
          ))}
        </section>
      </Container>
    </>
  );
};
