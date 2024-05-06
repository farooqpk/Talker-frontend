import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { Disc, ImageUp, Mic, SendHorizontal, Smile } from "lucide-react";
import { Theme } from "emoji-picker-react";
import EmojiPicker from "emoji-picker-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { convertToWebP } from "@/lib/convert-to-webp";

type Props = {
  handleTyping: (value: string) => void;
  handleSendMessage: (type: "TEXT" | "AUDIO" | "IMAGE", imgBlob?: Blob) => void;
  typedText: string;
  isRecording: boolean;
  startRecoring: () => void;
  stopRecording: () => void;
};

export const ChatFooter = ({
  handleTyping,
  handleSendMessage,
  typedText,
  isRecording,
  startRecoring,
  stopRecording,
}: Props) => {
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, []);

  const handleOnEmojiClick = (emojiData: any) => {
    if (chatInputRef.current) {
      const emoji = emojiData.emoji;
      chatInputRef.current.value += emoji;
      chatInputRef.current.focus();
      handleTyping(chatInputRef.current.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevents adding a new line
      typedText.length > 0 && handleSendMessage("TEXT");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const blob: Blob = await convertToWebP(file!);
    handleSendMessage("IMAGE", blob);
  };
  return (
    <section className="flex gap-1 md:gap-4 items-center px-5 md:px-24 relative">
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
            lazyLoadEmojis
            searchDisabled
          />
        </DialogContent>
      </Dialog>

      <Textarea
        placeholder="Type something..."
        className="resize-none"
        ref={chatInputRef}
        onChange={(e) => handleTyping(e.target.value)}
        value={typedText}
        onKeyDown={handleKeyDown}
      />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full p-2"
        onClick={() => uploadInputRef.current?.click()}
      >
        <ImageUp />
      </Button>

      <Input
        type="file"
        className="hidden"
        ref={uploadInputRef}
        accept="image/*"
        onChange={handleImageUpload}
      />

      {typedText.trim().length > 0 ? (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-2"
          onClick={() => handleSendMessage("TEXT")}
        >
          <SendHorizontal />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="rounded-full p-2">
          {isRecording ? (
            <Disc onClick={stopRecording} color="red" />
          ) : (
            <Mic onClick={startRecoring} />
          )}
        </Button>
      )}
    </section>
  );
};
