import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { Disc, ImageUp, Mic, SendHorizontal, Smile } from "lucide-react";
import { Theme } from "emoji-picker-react";
import EmojiPicker from "emoji-picker-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { useToast } from "../ui/use-toast";
import imageCompression from "browser-image-compression";

type Props = {
  handleTyping: (value: string) => void;
  handleSendMessage: (type: "TEXT" | "AUDIO" | "IMAGE", imgBlob?: Blob) => void;
  typedText: string;
  isRecording: boolean;
  startRecoring: () => void;
  stopRecording: () => void;
  recordingTime: number;
};

export default function ChatFooter ({
  handleTyping,
  handleSendMessage,
  typedText,
  isRecording,
  startRecoring,
  stopRecording,
  recordingTime,
}: Props) {
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    if (!file) return;

    // if greater than 1MB then return
    if (file.size > 1024 * 1024) {
      toast({
        description: "File size is too large",
        variant: "destructive",
      });
      return;
    }

    try {
      // compress under 100kb
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 100 / 1024,
        useWebWorker: true,
        fileType: "image/webp",
        maxWidthOrHeight: 1000,
      });

      handleSendMessage("IMAGE", compressedFile);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error compressing image",
        variant: "destructive",
      });
    }
  }; 

  useEffect(() => {
    console.log(recordingTime);
  }, [recordingTime]);

  return (
    <section className="flex gap-1 md:gap-4 items-center px-5 md:px-24 relative">
      <Dialog>
        <DialogTrigger>
          <Button variant="ghost" size="icon" className="rounded-full p-2">
            <Smile />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background border-none">
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
            <>
              <Disc
                onClick={stopRecording}
                className="animate-pulse"
                color="red"
              />
            </>
          ) : (
            <Mic onClick={startRecoring} />
          )}
        </Button>
      )}
    </section>
  );
};
