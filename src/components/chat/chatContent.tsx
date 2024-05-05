import { useGetUser } from "@/hooks/user";
import Container from "../Container";
import { MessageType } from "../../types";
import { formateDate } from "@/lib/format-date";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Props = {
  messages: MessageType[];
};

export const ChatContent = ({ messages }: Props) => {
  const { user } = useGetUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [audioPlayers, setAudioPlayers] = useState<
    Record<string, HTMLAudioElement>
  >({});

  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});

  const handleAudio = (audioId: string, audioBlob: Blob, isPlay: boolean) => {
    if (isPlay) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioPlayer = new Audio(audioUrl);
      audioPlayer
        .play()
        .catch((error) => {
          console.error("Failed to play audio:", error);
        })
        .then(() => {
          setAudioPlayers((prevState) => ({
            ...prevState,
            [audioId]: audioPlayer,
          }));
          setIsPlaying((prevState) => ({
            ...prevState,
            [audioId]: true,
          }));
          audioPlayer.onended = () => {
            setIsPlaying((prevState) => ({
              ...prevState,
              [audioId]: false,
            }));
          };
        });
    } else {
      const audioPlayer = audioPlayers[audioId];
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        setAudioPlayers((prevState) => {
          const newState = { ...prevState };
          delete newState[audioId];
          return newState;
        });
        setIsPlaying((prevState) => ({
          ...prevState,
          [audioId]: false,
        }));
      }
    }
  };

  return (
    <>
      <Container>
        <section
          ref={scrollRef}
          className="flex flex-col gap-4 h-[67vh] md:h-[65vh] overflow-y-scroll px-3 md:px-14 py-4"
        >
          <p className="text-center text-xs md:text-sm font-light text-warning mb-5">
            All messages are end to end encrypted
          </p>

          {messages?.map((msg, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-2 ${
                msg.senderId === user?.userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b">
                <h3 className="text-sm font-semibold">{`${
                  msg.senderId === user?.userId ? "You" : msg?.sender?.username
                }`}</h3>
              </div>

              <div>
                {msg.contentType === "TEXT" ? (
                  <p className="text-sm text-muted-foreground font-semibold">
                    {msg.content}
                  </p>
                ) : (
                  <div className="flex gap-3 p-3">
                    {isPlaying[msg?.messageId!!] ? (
                      <Pause
                        className="cursor-pointer"
                        onClick={() =>
                          handleAudio(
                            msg?.messageId!!,
                            msg.audio as Blob,
                            false
                          )
                        }
                      />
                    ) : (
                      <Play
                        className="cursor-pointer"
                        onClick={() =>
                          handleAudio(msg?.messageId!!, msg.audio as Blob, true)
                        }
                      />
                    )}
                    <p>audio..</p>
                  </div>
                )}
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
