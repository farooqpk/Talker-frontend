import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePeer } from "@/context/peerProvider";
import { findUserApi } from "@/services/api/user";
import { MicOff, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Watch } from "react-loader-spinner";
import { useQuery } from "react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export const VoiceCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipientPeerId = searchParams.get("peerId");
  const peer = usePeer();
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const { data: recipient } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const handleOffCall = () => {
    peer?.off("call");
    navigate(`/chat/${id}`);
  };

  useEffect(() => {
    console.log("here.......");

    peer?.on("call", (call) => {
      console.log(call);
      navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
          call.answer(stream);
          setIsCallAccepted(true);
          call.on("stream", (remoteStream) => {
            console.log(remoteStream);
          })
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }, [peer]);

  useEffect(() => {
    if (!recipientPeerId) return;
    console.log("here", recipientPeerId);

    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        console.log(stream);
        const call = peer?.call(recipientPeerId, stream);
        console.log(call);
        call?.on("stream", (remoteStream) => {
          console.log(remoteStream);
          setIsCallAccepted(true);
          console.log(remoteStream);
        });
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });
  }, [recipientPeerId, peer]);

  return (
    <section className="absolute inset-0 h-[90%] md:h-[80%] w-[80%] md:w-[30%] rounded-3xl m-auto shadow-sm shadow-slate-600">
      <div className="flex flex-col items-center justify-evenly h-full">
        <div className="flex flex-col gap-7 items-center ">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="text-3xl">
              {recipient?.username[0]}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl">{recipient?.username}</h3>
          {isCallAccepted ? (
            <>
              <p>5:30</p>
              <Watch color="#ffffff" />
            </>
          ) : (
            <p>Calling...</p>
          )}
        </div>

        <div className="flex gap-5 items-center">
          {isCallAccepted && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-2 w-14 h-14"
            >
              <MicOff size={30} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-2 w-14 h-14"
          >
            <PhoneOff color="red" size={30} onClick={handleOffCall} />
          </Button>
        </div>
      </div>
    </section>
  );
};
