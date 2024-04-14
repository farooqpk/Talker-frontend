import { Button } from "@/components/ui/button";
import { usePeer } from "@/context/peerProvider";
import { useSocket } from "@/context/socketProvider";
import { findUserApi } from "@/services/api/user";
import { PhoneOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export const VideoCall = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const recipientPeerId = searchParams.get("peerId");
  const initiateCall = searchParams.get("initiateCall");
  const navigate = useNavigate();
  const peer = usePeer();
  const socket = useSocket();
  const { data: recipient } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const initiateVideoCall = () => {
    socket?.emit("answerOrRejectCall", {
      toUserId: id,
      callType: "video-call",
    });
  };

  useEffect(() => {
    socket?.on("callAnswered", () => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          const call = peer?.call(recipientPeerId!, stream);

          console.log(call, "call");
          call?.on("stream", (remoteStream) => {
            console.log(remoteStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
        })
        .catch((error) => {
          console.error("Error accessing camera and microphone:", error);
        });
    });
  }, [socket]);

  useEffect(() => {
    if (initiateCall === "true") {
      initiateVideoCall();
    }
  }, [initiateCall]);

  useEffect(() => {
    console.log("here.......");

    peer?.on("call", function (call) {
      console.log("hi", call);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream);
          call.on("stream", function (remoteStream) {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
          // Displaying local stream for the recipient
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error("Error accessing camera and microphone:", error);
        });
    });
  }, [peer]);

  return (
    <section className="absolute inset-0 flex flex-col p-10 items-center justify-between">
      <h1 className="text-3xl font-bold">Video Call</h1>
      <div className="flex justify-around items-center w-full">
        <div className="flex flex-col gap-3">
          <video
            ref={localVideoRef}
            className="w-[400px] h-[300px] rounded-xl "
            autoPlay
            muted
          />
          <h4 className="text-center">Me</h4>
        </div>
        <div className="flex flex-col gap-3">
          <video
            ref={remoteVideoRef}
            className="w-[400px]  h-[300px] rounded-xl "
            autoPlay
          />
          <h4 className="text-center">{recipient?.username}</h4>
        </div>
      </div>
      <div className="flex gap-5 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-2 w-14 h-14"
        >
          <PhoneOff
            color="red"
            size={30}
            onClick={() => {
              peer?.off("call");
              peer?.destroy();
              navigate(`/chat/${id}`);
              location.reload();
            }}
          />
        </Button>
      </div>
    </section>
  );
};
