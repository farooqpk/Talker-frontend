import { useGetUser } from "@/hooks/useGetUser";
import Container from "../Container";
import { ContentType, MsgStatus, type MessageType } from "../../types";
import { formateDate } from "@/lib/format-date";
import { type ReactElement, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Check,
  CheckCheck,
  Loader2,
  Pause,
  Play,
  Trash2,
  X,
} from "lucide-react";
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
import { ThreeDots } from "react-loader-spinner";
import { IconButton } from "../IconButton";

type Props = {
  messages: MessageType[];
  handleDeleteMsg: (id: string) => void;
  sendMessageLoading: boolean;
  handleGetMedia: (
    mediapath: string,
    type: ContentType,
    messageId: string
  ) => void;
  getMediaLoading: {
    messageId: string;
    loading: boolean;
  };
  handleReadMessage: (msgId: string) => void;
};

export default function ChatContent({
  messages,
  handleDeleteMsg,
  sendMessageLoading,
  handleGetMedia,
  getMediaLoading,
  handleReadMessage,
}: Props): ReactElement {
  const { user } = useGetUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDeleteMsg, setIsDeleteMsg] = useState<boolean>(false);
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [audioPlayers, setAudioPlayers] = useState<
    Record<string, HTMLAudioElement>
  >({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const currentAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollRef.current, sendMessageLoading]);

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
          currentAudioPlayerRef.current = audioPlayer;
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
        currentAudioPlayerRef.current = null;
      }
    }
  };

  const IsRead = (msgStatus: MsgStatus[]) => {
    return msgStatus.every((status) => status.isRead);
  };

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.senderId === user?.userId) return;

    const isReadLastMsg = lastMessage.status.find(
      (status) => status.userId === user?.userId
    )?.isRead;

    if (!isReadLastMsg) {
      handleReadMessage(lastMessage.messageId);
    }
  }, [messages]);

  // when component unmounts, pause the audio and reset the state
  useEffect(() => {
    return () => {
      if (currentAudioPlayerRef.current) {
        currentAudioPlayerRef.current.pause();
        currentAudioPlayerRef.current.currentTime = 0;
      }
      setAudioPlayers({});
      setIsPlaying({});
    };
  }, []);

  return (
    <Container>
      <section
        ref={scrollRef}
        className="flex flex-col gap-4 h-[66vh] md:h-[65vh] overflow-y-scroll px-3 md:px-14 py-4"
      >
        <Alert>
          <AlertDescription className="text-warning text-center">
            All messages are secured using <strong>hybrid encryption</strong>,
            combining the strengths of both RSA and AES algorithms for
            end-to-end encryption.
          </AlertDescription>
        </Alert>

        {messages?.map((msg) => {
          return (
            <div
              key={msg.messageId}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-4 ${
                msg.senderId === user?.userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b flex justify-between items-center gap-3 pb-2">
                <h3 className="text-sm font-semibold">{`${
                  msg.senderId === user?.userId ? "You" : msg?.sender?.username
                }`}</h3>

                {msg.senderId === user?.userId && !msg.isDeleted && (
                  <IconButton
                    icon={<Trash2 color="red" size={18} />}
                    className="w-8 h-8"
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
                ) : msg.contentType === ContentType.TEXT ? (
                  <p className="text-sm md:max-w-xl text-muted-foreground font-semibold">
                    {msg.text}
                  </p>
                ) : msg.contentType === ContentType.AUDIO ? (
                  <div className="flex gap-3 p-3 items-center">
                    {
                      // if not downloaded
                      !msg.audio ? (
                        <IconButton
                          icon={
                            getMediaLoading?.messageId === msg?.messageId &&
                            getMediaLoading.loading ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <ArrowDown />
                            )
                          }
                          className="w-8 h-8 "
                          onClick={() =>
                            handleGetMedia(
                              msg?.mediaPath as string,
                              ContentType.AUDIO,
                              msg.messageId
                            )
                          }
                          disabled={
                            getMediaLoading?.messageId === msg?.messageId &&
                            getMediaLoading.loading
                          }
                        />
                      ) : isPlaying[msg?.messageId] ? (
                        <IconButton
                          icon={<Pause />}
                          className="w-9 h-9"
                          onClick={() =>
                            handleAudio(
                              msg?.messageId,
                              msg.audio as Blob,
                              false
                            )
                          }
                        />
                      ) : (
                        <IconButton
                          icon={<Play />}
                          className="w-9 h-9"
                          onClick={() =>
                            handleAudio(msg?.messageId, msg.audio as Blob, true)
                          }
                        />
                      )
                    }
                    <p>Audio..</p>
                  </div>
                ) : msg.contentType === ContentType.IMAGE ? (
                  <div>
                    {
                      // if not downloaded
                      !msg.image ? (
                        <div className="flex gap-3 p-3 items-center">
                          <IconButton
                            icon={
                              getMediaLoading?.messageId === msg?.messageId &&
                              getMediaLoading.loading ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <ArrowDown />
                              )
                            }
                            className="w-8 h-8"
                            onClick={() =>
                              handleGetMedia(
                                msg?.mediaPath as string,
                                ContentType.IMAGE,
                                msg.messageId
                              )
                            }
                            disabled={
                              getMediaLoading?.messageId === msg?.messageId &&
                              getMediaLoading.loading
                            }
                          />
                          <p>Image..</p>
                        </div>
                      ) : (
                        <div className="md:h-48 md:max-w-md">
                          <img
                            src={URL.createObjectURL(msg.image as Blob)}
                            alt="Image"
                            className="object-contain w-full h-full cursor-pointer"
                            onClick={() =>
                              setLightboxImage(
                                URL.createObjectURL(msg.image as Blob)
                              )
                            }
                          />
                        </div>
                      )
                    }
                  </div>
                ) : null}
              </div>

              <div className="flex ml-auto items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formateDate(msg.createdAt)}
                </span>
                {msg.senderId === user?.userId && !msg.isDeleted && (
                  <span className="text-xs text-muted-foreground">
                    {IsRead(msg.status) ? (
                      <CheckCheck className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {sendMessageLoading && (
          <div className="ml-auto border rounded-3xl p-3">
            <ThreeDots color="#E5E7EB" width={50} />
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex justify-center items-center z-20">
          <img
            src={lightboxImage}
            alt="Lightbox"
            className="max-w-full max-h-full"
          />
          <IconButton
            icon={<X />}
            className="absolute top-4 right-4 rounded-full w-10 h-10 bg-primary-foreground"
            onClick={() => setLightboxImage(null)}
          />
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
}
