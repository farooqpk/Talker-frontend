import Container from "@/components/Container";
import { IconButton } from "@/components/IconButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAiApi } from "@/services/api/ai";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { ArrowLeft, SendHorizontal, Smile, Sparkle } from "lucide-react";
import { ReactElement, useEffect, useRef, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { useMutation } from "react-query";
import { Link } from "react-router-dom";
import Markdown from "react-markdown";

export default function AiChat(): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [typedText, setTypedText] = useState("");
  const [messages, setMessages] = useState<
    { text: string; type: "input" | "output" }[]
  >([]);

  const { mutate, isLoading, isError } = useMutation(chatWithAiApi, {
    onSuccess(data) {
      if (!data) return;
      setMessages((prev) => [...prev, { text: data?.message, type: "output" }]);
    },
  });

  const onSubmit = () => {
    if (typedText.trim().length === 0) return;
    setTypedText("");
    setMessages((prev) => [...prev, { text: typedText, type: "input" }]);
    mutate({ message: typedText });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOnEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    setTypedText((prev) => prev + emoji);
    chatInputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <main className="flex flex-col h-full">
      <div className="flex items-center p-6 rounded-xl border-b">
        <Link to={`/`} className="absolute">
          <IconButton icon={<ArrowLeft />} className="w-8 h-8" />
        </Link>
        <div className="flex flex-col md:gap-2 mx-auto">
          <p className="text-lg font-semibold flex items-center gap-2">
            Talker AI <Sparkle />
          </p>
        </div>
      </div>

      <Container>
        <section
          ref={scrollRef}
          className="flex flex-col gap-4 h-[67vh] md:h-[65vh] overflow-y-scroll px-3 md:px-14 py-4"
        >
          <Alert>
            <AlertDescription className="text-warning text-center">
              This is an AI-powered chat. Responses may not be perfect. Avoid
              sharing personal or sensitive information.
            </AlertDescription>
          </Alert>

          {messages.map(({ text, type }, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-4 max-w-2xl ${
                type === "input" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b flex justify-between items-center gap-3 pb-2">
                <h3 className="text-sm font-semibold">
                  {type === "input" ? "You" : "AI"}
                </h3>
              </div>
              <div>
                <Markdown
                  className={
                    "text-sm text-muted-foreground font-semibold overflow-auto whitespace-pre-wrap"
                  }
                >
                  {text}
                </Markdown>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto border rounded-3xl p-3">
              <ThreeDots color="#E5E7EB" width={50} />
            </div>
          )}

          {isError && (
            <div className="ml-auto border rounded-3xl p-3 bg-red-100">
              <p className="text-sm text-red-600 font-semibold">
                Something went wrong. Please try again.
              </p>
            </div>
          )}
        </section>
      </Container>

      <section className="flex gap-1 md:gap-4 items-center px-5 md:px-24 relative">
        <Dialog>
          <DialogTrigger>
            <IconButton icon={<Smile />} className="p-2 border-none" />
          </DialogTrigger>
          <DialogContent className="bg-background border-none">
            <EmojiPicker
              onEmojiClick={handleOnEmojiClick}
              theme={Theme.DARK}
              skinTonesDisabled
              width={"95%"}
              style={{ backgroundColor: "transparent" }}
            />
          </DialogContent>
        </Dialog>

        <Textarea
          placeholder="Type something..."
          className="resize-none"
          ref={chatInputRef}
          onChange={(e) => setTypedText(e.target.value)}
          value={typedText}
          onKeyDown={handleKeyDown}
          maxLength={500}
        />

        <IconButton
          icon={<SendHorizontal />}
          className={`p-2 border-none ${
            typedText.length === 0 || typedText.length >= 500
              ? "cursor-not-allowed hover:bg-transparent"
              : ""
          }`}
          disabled={typedText.length === 0 || typedText.length >= 500}
          onClick={onSubmit}
        />
      </section>
    </main>
  );
}
