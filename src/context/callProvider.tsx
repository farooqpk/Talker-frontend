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
    try {
      const stream = await getMediaStream(callType);

      setCallState({
        isOpen: true,
        callType,
        status: "initiating",
        initiaterId: user?.userId || null,
        initiaterName: user?.username || null,
        recipientId,
        recipientName,
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
      toast({ title: "Failed to answer call" });
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
    const opponentId =
      callState.initiaterId === user?.userId
        ? callState.recipientId
        : callState?.initiaterId;

    socket?.emit(SocketEvents.END_CALL, opponentId);
    shutdownCall();
  };

  const rejectCall = () => {
    const opponentId =
      callState.initiaterId === user?.userId
        ? callState.recipientId
        : callState?.initiaterId;

    socket?.emit(SocketEvents.REJECT_CALL, opponentId);
    shutdownCall();
  };

  const handleGetRecipientPeerId = (recipientPeerId: string) => {
    if (!peer || !recipientPeerId) return;
    setCallState((prevState) => ({
      ...prevState,
      recipientPeerId,
      status: "ringing",
    }));
  };

  const callEndedByOpponent = () => {
    toast({
      title: `Call ended by ${
        callState.initiaterId === user?.userId
          ? callState.recipientName
          : callState?.initiaterName
      }`,
    });
    shutdownCall();
  };

  const callRejectedByOpponent = () => {
    toast({
      title: `Call rejected by ${
        callState.initiaterId === user?.userId
          ? callState.recipientName
          : callState?.initiaterName
      }`,
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
