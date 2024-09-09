import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useSocket } from "./socketProvider";
import { usePeer } from "./peerProvider";
import { SocketEvents } from "@/types/index";
import { CallModal } from "@/components/chat/callModel";
import { useGetUser } from "@/hooks/useGetUser";
import { MediaConnection } from "peerjs";
import { toast } from "@/components/ui/use-toast";
import ringMp3 from "../assets/ring.mp3";

type CallType = "audio" | "video";

interface CallState {
  isOpen: boolean;
  callType: CallType | null;
  status: "initiating" | "ringing" | "connected" | "ended";
  initiaterId: string | null;
  initiaterName: string | null;
  recipientId: string | null;
  recipientName: string | null;
  recipientPeerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: MediaConnection | null;
}

type InitiateCallArgs = {
  recipientId: string;
  recipientName: string;
  callType: CallType;
};

interface CallContextType {
  callState: CallState;
  initiateCall: ({
    recipientId,
    recipientName,
    callType,
  }: InitiateCallArgs) => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    callType: null,
    status: "ended",
    initiaterId: null,
    initiaterName: null,
    recipientId: null,
    recipientName: null,
    recipientPeerId: null,
    localStream: null,
    remoteStream: null,
    incomingCall: null,
  });
  const { user } = useGetUser();
  const socket = useSocket();
  const peer = usePeer();
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    ringAudioRef.current = new Audio(ringMp3);
    ringAudioRef.current.loop = true;

    return () => {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause();
        ringAudioRef.current = null;
      }
    };
  }, []);

  const playRingtone = () => {
    ringAudioRef.current
      ?.play()
      .catch((error) => console.error("Error playing ringtone:", error));
  };

  const stopRingtone = () => {
    if (ringAudioRef.current) {
      ringAudioRef.current.pause();
      ringAudioRef.current.currentTime = 0;
    }
  };

  const getMediaStream = async (callType: CallType): Promise<MediaStream> => {
    const constraints = {
      audio: true,
      video: callType === "video",
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      toast({ title: "Error accessing media devices" });
      throw error;
    }
  };

  const initiateCall = async ({
    recipientId,
    recipientName,
    callType,
  }: InitiateCallArgs) => {
    playRingtone();
    setCallState({
      isOpen: true,
      callType,
      status: "initiating",
      initiaterId: user?.userId || null,
      initiaterName: user?.username || null,
      recipientId,
      recipientName,
      recipientPeerId: null,
      localStream: null,
      remoteStream: null,
      incomingCall: null,
    });
    socket?.emit(SocketEvents.GET_RECIPIENT_PEER_ID, { recipientId });
  };

  const answerCall = async () => {
    stopRingtone();

    if (!callState.incomingCall) {
      console.error("No incoming call to answer");
      toast({ title: "Error: No incoming call to answer" });
      return;
    }

    try {
      const stream = await getMediaStream(callState.callType || "video");

      callState.incomingCall.answer(stream);

      setCallState((prevState) => ({
        ...prevState,
        status: "connected",
        localStream: stream,
      }));

      callState.incomingCall.on("stream", (remoteStream) => {
        console.log("Received remote stream");
        setCallState((prevState) => ({
          ...prevState,
          remoteStream,
          status: "connected",
        }));
      });
    } catch (error) {
      console.error("Failed to answer call:", error);
      toast({ title: "Failed to answer call" });
      stopRingtone();
      shutdownCall();
    }
  };

  const shutdownCall = () => {
    if (callState.incomingCall) {
      callState.incomingCall.close();
    }

    if (callState.localStream) {
      callState.localStream.getTracks().forEach((track) => track.stop());
    }

    if (callState.remoteStream) {
      callState.remoteStream.getTracks().forEach((track) => track.stop());
    }

    stopRingtone();

    setCallState({
      isOpen: false,
      callType: null,
      status: "ended",
      initiaterId: null,
      initiaterName: null,
      recipientId: null,
      recipientName: null,
      recipientPeerId: null,
      localStream: null,
      remoteStream: null,
      incomingCall: null,
    });
  };

  const endCall = () => {
    stopRingtone();

    const opponentId =
      callState.initiaterId === user?.userId
        ? callState.recipientId
        : callState?.initiaterId;

    socket?.emit(SocketEvents.END_CALL, opponentId);
    shutdownCall();
  };

  const rejectCall = () => {
    stopRingtone();
    const opponentId =
      callState.initiaterId === user?.userId
        ? callState.recipientId
        : callState?.initiaterId;

    socket?.emit(SocketEvents.REJECT_CALL, opponentId);
    shutdownCall();
  };

  const handleGetRecipientPeerId = async (recipientPeerId: string) => {
    if (!peer || !recipientPeerId) return;
    try {
      const stream = await getMediaStream(callState.callType || "video");

      setCallState((prevState) => ({
        ...prevState,
        recipientPeerId,
        status: "ringing",
        localStream: stream,
      }));
    } catch (error) {
      toast({ title: "Failed to initiate call" });
    }
  };

  const callEndedByOpponent = () => {
    toast({
      title: `Call has ended`,
    });
    shutdownCall();
  };

  const callRejectedByOpponent = () => {
    toast({
      title: `Call was rejected`,
    });
    shutdownCall();
  };

  useEffect(() => {
    if (!socket || !peer) return;

    socket.on(SocketEvents.GET_RECIPIENT_PEER_ID, handleGetRecipientPeerId);

    socket.on(SocketEvents.END_CALL, callEndedByOpponent);

    socket.on(SocketEvents.REJECT_CALL, callRejectedByOpponent);

    // getting incoming call
    peer.on("call", (call) => {
      const { initiater, initiaterId, callType } = call.metadata;
      playRingtone();
      setCallState((prevState) => ({
        ...prevState,
        isOpen: true,
        status: "ringing",
        incomingCall: call,
        callType: callType,
        initiaterId: initiaterId,
        initiaterName: initiater,
      }));
    });

    if (
      callState.status === "ringing" &&
      callState.initiaterId === user?.userId &&
      callState.recipientPeerId &&
      callState.localStream
    ) {
      // making call
      const call = peer.call(callState.recipientPeerId, callState.localStream, {
        metadata: {
          initiater: user?.username,
          initiaterId: user?.userId,
          callType: callState.callType,
        },
      });

      // getting remote stream
      call.on("stream", (remoteStream) => {
        stopRingtone();
        setCallState((prevState) => ({
          ...prevState,
          remoteStream,
          status: "connected",
        }));
      });

      call.on("close", endCall);
      call.on("error", endCall);
    }

    return () => {
      socket.off(SocketEvents.GET_RECIPIENT_PEER_ID, handleGetRecipientPeerId);
      socket.off(SocketEvents.END_CALL, callEndedByOpponent);
      socket.off(SocketEvents.REJECT_CALL, callRejectedByOpponent);
      peer.removeAllListeners();
    };
  }, [
    socket,
    peer,
    callState.status,
    callState.recipientPeerId,
    callState.localStream,
    user?.userId,
  ]);

  return (
    <CallContext.Provider
      value={{
        callState,
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
      <CallModal />
    </CallContext.Provider>
  );
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
};
