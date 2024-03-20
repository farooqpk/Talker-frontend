import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { Mic, SendHorizontal, Smile } from "lucide-react";

export const ChatFooter = () => {
  let typing = true;
  return (
    <section className="flex gap-3 md:gap-4 items-center px-5 md:px-24">
      <Button variant="ghost" size="icon" className="rounded-full p-2">
        <Smile />
      </Button>

      <Textarea placeholder="Type something..." className="resize-none" />

      {typing ? (
        <Button variant="ghost" size="icon" className="rounded-full p-2">
          <SendHorizontal />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="rounded-full p-2">
          <Mic />
        </Button>
      )}
    </section>
  );
};
