import Container from "@/components/Container";
import { IconButton } from "@/components/IconButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAiApi, getAiChatHistoryApi } from "@/services/api/ai";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { ArrowLeft, SendHorizontal, Smile, Sparkle } from "lucide-react";
import { ReactElement, useEffect, useRef, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import Markdown from "react-markdown";
import Loader from "@/components/loader";
import { toast } from "@/components/ui/use-toast";

export default function AiChat(): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [typedText, setTypedText] = useState("");
  const queryClient = useQueryClient();

  const { data: history, isLoading: historyLoading } = useQuery(
    ["aiChatHistory"],
    {
      queryFn: getAiChatHistoryApi,
    }
  );

  const {
    mutate,
    isLoading: mutateLoading,
    isError,
  } = useMutation({
    mutationFn: chatWithAiApi,
  });

  const onSubmit = () => {
    if (typedText.trim().length === 0) return;
    setTypedText("");
    const updatedHistory = [
      ...(history || []),
      {
        content: typedText,
        role: "user",
      },
    ];
    queryClient.setQueryData(["aiChatHistory"], updatedHistory);
    mutate(
      { message: typedText },
      {
        onSuccess: (data) => {
          if (!data) return;
          queryClient.setQueryData(
            ["aiChatHistory"],
            [
              ...updatedHistory,
              {
                content: data.message,
                role: "model",
              },
            ]
          );
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              error?.response?.data?.message ||
              "Something went wrong. Please try again.",
          });
        },
      }
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

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

  if (historyLoading) {
    return <Loader />;
  }

  return (
    <main className="flex flex-col absolute inset-0">
      <div className="flex items-center p-6 border-b">
        <Link to={`/`} className="absolute">
          <IconButton icon={<ArrowLeft />} className="w-8 h-8" />
        </Link>
        <div className="flex flex-col md:gap-2 mx-auto">
          <p className="text-lg font-semibold flex items-center gap-2">
            Talker AI <Sparkle />
          </p>
        </div>
      </div>

      <Container className="flex-1 flex flex-col overflow-hidden">
        <section
          ref={scrollRef}
          className="flex-1 flex flex-col gap-4 overflow-y-auto p-4"
        >
          <Alert>
            <AlertDescription className="text-warning text-center">
              This is an AI-powered chat. Responses may not be perfect. Avoid
              sharing personal or sensitive information.
            </AlertDescription>
          </Alert>

          {history?.map(({ content, role }, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-4 ${
                role === "user" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b flex justify-between items-center gap-3 pb-2">
                <h3 className="text-sm font-semibold">
                  {role === "user" ? "You" : "AI"}
                </h3>
              </div>
              <div>
                <Markdown
                  className={
                    "text-sm text-muted-foreground font-semibold whitespace-pre-wrap"
                  }
                >
                  {content}
                </Markdown>
              </div>
            </div>
          ))}

          {mutateLoading && (
            <div className="mr-auto border rounded-3xl p-3">
              <ThreeDots color="#E5E7EB" width={50} />
            </div>
          )}

          {/* Error message */}
          {isError && (
            <div className="ml-auto border rounded-3xl p-3 bg-red-100">
              <p className="text-sm text-red-600 font-semibold">
                Something went wrong. Please try again.
              </p>
            </div>
          )}
        </section>
      </Container>

      <section className="flex items-center p-5 border-t">
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
          className="resize-none flex-grow"
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
