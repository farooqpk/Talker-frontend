import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { Mic, SendHorizontal, Smile } from "lucide-react";
import { Theme } from "emoji-picker-react";
import EmojiPicker from "emoji-picker-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export const ChatFooter = () => {
  let typing = true;

  const handleOnEmojiClick = (emoji: any) => {
    console.log(emoji.emoji);
  };

  return (
    <section className="flex gap-3 md:gap-4 items-center px-5 md:px-24 relative">
      <Dialog>
        <DialogTrigger>
          <Button variant="ghost" size="icon" className="rounded-full p-2">
            <Smile />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-transparent border-none">
          <EmojiPicker
            onEmojiClick={handleOnEmojiClick}
            theme={Theme.DARK}
            skinTonesDisabled
            width={"95%"}
            style={{ backgroundColor: "transparent" }}
          />
        </DialogContent>
      </Dialog>

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
