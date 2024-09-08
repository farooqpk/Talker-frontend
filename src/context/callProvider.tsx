import React, { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "./socketProvider";
import { usePeer } from "./peerProvider";
import { SocketEvents } from "@/types/index";
import { CallModal } from "@/components/chat/callModel";
import { useGetUser } from "@/hooks/useGetUser";
import { MediaConnection } from "peerjs";
import { toast } from "@/components/ui/use-toast";

type CallType = "audio" | "video";

interface CallState {
  isOpen: boolean;
  callType: CallType | null;
  status: "initiating" | "ringing" | "connected" | "ended";
  initiaterId: string | null;
  initiaterName: string | null;
  recipientId: string | null;
  recipientPeerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: MediaConnection | null;
}

interface CallContextType {
  callState: CallState;
  initiateCall: (recipientId: string, callType: CallType) => void;
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
    recipientPeerId: null,
    localStream: null,
    remoteStream: null,
    incomingCall: null,
  });
  const { user } = useGetUser();
  const socket = useSocket();
  const peer = usePeer();

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

  const initiateCall = async (recipientId: string, callType: CallType) => {
    try {
      const stream = await getMediaStream(callType);

      setCallState({
        isOpen: true,
        callType,
        status: "initiating",
        initiaterId: user?.userId || null,
        initiaterName: user?.username || null,
        recipientId,
        recipientPeerId: null,
        localStream: stream,
        remoteStream: null,
        incomingCall: null,
      });
      socket?.emit(SocketEvents.GET_RECIPIENT_PEER_ID, { recipientId });
    } catch (error) {
      toast({ title: "Failed to initiate call" });
    }
  };

  const answerCall = async () => {
    try {
      const stream = await getMediaStream(callState.callType || "video");

      callState.incomingCall?.answer(stream);

      setCallState((prevState) => ({
        ...prevState,
        status: "connected",
        localStream: stream,
      }));

      callState.incomingCall?.on("stream", (remoteStream) => {
        setCallState((prevState) => ({
          ...prevState,
          remoteStream,
          status: "connected",
        }));
      });
    } catch (error) {
      toast({ title: "Error answering call" });
    }
  };

  const rejectCall = () => {
    // Close the incoming call if exists
    if (callState.incomingCall) {
      callState.incomingCall.close();
    }

    // Reset the call state
    setCallState({
      isOpen: false,
      callType: null,
      status: "ended",
      initiaterId: null,
      initiaterName: null,
      recipientId: null,
      recipientPeerId: null,
      localStream: null,
      remoteStream: null,
      incomingCall: null,
    });
  };

  const endCall = () => {
    // Close peer connections
    if (callState.incomingCall) {
      callState.incomingCall.close();
    }

    // Close local media streams
    if (callState.localStream) {
      callState.localStream.getTracks().forEach((track) => track.stop());
    }

    // Reset call state
    setCallState({
      isOpen: false,
      callType: null,
      status: "ended",
      initiaterId: null,
      initiaterName: null,
      recipientId: null,
      recipientPeerId: null,
      localStream: null,
      remoteStream: null,
      incomingCall: null,
    });
  };

  const handleGetRecipientPeerId = (recipientPeerId: string) => {
    if (!peer || !recipientPeerId) return;
    setCallState((prevState) => ({
      ...prevState,
      recipientPeerId,
      status: "ringing",
    }));
  };

  useEffect(() => {
    if (!socket || !peer) return;

    socket.on(SocketEvents.GET_RECIPIENT_PEER_ID, handleGetRecipientPeerId);

    peer.on("call", (call) => {
      const { initiater, initiaterId, callType } = call.metadata;

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

    return () => {
      socket.off(SocketEvents.GET_RECIPIENT_PEER_ID, handleGetRecipientPeerId);
    };
  }, [socket, peer]);

  useEffect(() => {
    if (!peer || !callState.recipientPeerId || !callState.localStream) return;

    if (
      callState.status === "ringing" &&
      callState.initiaterId === user?.userId
    ) {
      const call = peer.call(callState.recipientPeerId, callState.localStream, {
        metadata: {
          initiater: user?.username,
          initiaterId: user?.userId,
          callType: callState.callType,
        },
      });

      call.on("stream", (remoteStream) => {
        setCallState((prevState) => ({
          ...prevState,
          remoteStream,
          status: "connected",
        }));
      });

      call.on("close", () => {
        console.log("closed");
        endCall();
      });
      call.on("error", endCall);
    }
  }, [
    callState.status,
    callState.recipientPeerId,
    callState.localStream,
    peer,
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
