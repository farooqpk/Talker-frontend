import { useGetUser } from "@/hooks/user";
import Container from "../Container";
import { MessageType } from "../../types";
import { formateDate } from "@/lib/format-date";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "../ui/button";

type Props = {
  messages: MessageType[];
  handleDeleteMsg: (id: string) => void;
};

export const ChatContent = ({ messages, handleDeleteMsg }: Props) => {
  const { user } = useGetUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDeleteMsg, setIsDeleteMsg] = useState<boolean>(false);
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
    <Container>
      <section
        ref={scrollRef}
        className="flex flex-col gap-4 h-[67vh] md:h-[65vh] overflow-y-scroll px-3 md:px-14 py-4"
      >
        <Alert>
          <AlertDescription className="text-warning">
            All messages are secured using <strong>hybrid encryption</strong>,
            combining the strengths of both RSA and AES algorithms for
            end-to-end encryption.
          </AlertDescription>
        </Alert>

        {messages?.map((msg, index) => {
          return (
            <div
              key={index}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-2 ${
                msg.senderId === user?.userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b flex justify-between items-center gap-3 pb-2">
                <h3 className="text-sm font-semibold">{`${
                  msg.senderId === user?.userId ? "You" : msg?.sender?.username
                }`}</h3>

                {msg.senderId === user?.userId && !msg.isDeleted && (
                  <Trash2
                    size={16}
                    color="red"
                    className="cursor-pointer"
                    onClick={() => {
                      setDeleteMsgId(msg.messageId);
                      setIsDeleteMsg(true);
                    }}
                  />
                )}
              </div>

              <div>
                {msg.isDeleted ? (
                  <p className="text-sm text-muted-foreground font-semibold">
                    This message was deleted
                  </p>
                ) : msg.contentType === "TEXT" ? (
                  <p className="text-sm text-muted-foreground font-semibold">
                    {msg.content}
                  </p>
                ) : msg.contentType === "AUDIO" ? (
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
                ) : msg.contentType === "IMAGE" ? (
                  <img
                    src={URL.createObjectURL(msg.image as Blob)}
                    alt="Image"
                    className="object-contain w-72 h-56  cursor-pointer"
                    onClick={() =>
                      setLightboxImage(URL.createObjectURL(msg.image as Blob))
                    }
                  />
                ) : null}
              </div>

              <div className="ml-auto">
                <span className="text-xs text-muted-foreground">
                  {formateDate(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex justify-center items-center z-20">
          <img
            src={lightboxImage}
            alt="Lightbox Image"
            className="max-w-full max-h-full"
          />
          <Button
            className="absolute top-4 right-4 rounded-full"
            size={"icon"}
            variant={"outline"}
            onClick={() => setLightboxImage(null)}
          >
            <X />
          </Button>
        </div>
      )}

      {isDeleteMsg && (
        <AlertDialog open={isDeleteMsg}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure to delete?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteMsg(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleDeleteMsg(deleteMsgId as string);
                  setIsDeleteMsg(false);
                  setDeleteMsgId(null);
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Container>
  );
};
