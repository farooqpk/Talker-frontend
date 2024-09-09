import React, { useEffect, useRef, useState } from "react";
import { useCallContext } from "@/context/callProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGetUser } from "@/hooks/useGetUser";
import { PhoneIcon, VideoIcon, Mic } from "lucide-react";

export const CallModal: React.FC = () => {
  const { callState, answerCall, rejectCall, endCall } = useCallContext();
  const { user } = useGetUser();

  const localMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(
    null
  );
  const remoteMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(
    null
  );

  const [showUserOfflineMsg, setShowUserOfflineMsg] = useState(false);

  useEffect(() => {
    if (callState.localStream && localMediaRef.current) {
      localMediaRef.current.srcObject = callState.localStream;
    }

    if (callState.remoteStream && remoteMediaRef.current) {
      remoteMediaRef.current.srcObject = callState.remoteStream;
    }
  }, [
    localMediaRef.current,
    remoteMediaRef.current,
    callState.localStream,
    callState.remoteStream,
  ]);

  const showLocalVideo =
    callState.callType === "video" &&
    callState.localStream &&
    ((callState.status === "ringing" &&
      callState.initiaterId === user?.userId) ||
      callState.status === "connected");

  const showRemoteVideo =
    callState.callType === "video" &&
    callState.status === "connected" &&
    callState.remoteStream;

  const showAudio =
    callState.callType === "audio" && callState.status === "connected";

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!callState.recipientPeerId && callState.initiaterId === user?.userId) {
      timer = setTimeout(() => {
        setShowUserOfflineMsg(true);
      }, 4000);
    }

    return () => {
      clearTimeout(timer);
      setShowUserOfflineMsg(false);
    };
  }, [callState.recipientPeerId, callState.initiaterId]);

  return (
    <Dialog open={callState.isOpen}>
      <DialogContent
        hideCloseButton
        className={`w-full ${
          callState.status === "connected" && callState.callType === "video"
            ? "max-w-3xl"
            : "max-w-xl"
        } h-auto max-h-[95vh] overflow-y-auto`}
      >
        <DialogHeader>
          {(callState.status === "initiating" ||
            callState.status === "ringing") && (
            <DialogTitle className="text-lg md:text-xl sm:text-base font-bold text-center">
              {(() => {
                if (callState.initiaterId === user?.userId) {
                  return callState.status === "initiating"
                    ? `Calling ${callState.recipientName}...`
                    : `Ringing ${callState.recipientName}...`;
                } else {
                  return `Incoming ${callState.callType} call from ${callState?.initiaterName}`;
                }
              })()}
            </DialogTitle>
          )}
        </DialogHeader>

        {showUserOfflineMsg && (
          <p className="text-warning text-sm text-center">
            {"Recipient is offline. Please try again later."}
          </p>
        )}

        <div className="py-3 flex flex-col items-center">
          {(callState.status === "ringing" ||
            callState.status === "initiating") && (
            <div className="flex justify-center mb-2">
              {callState.callType === "video" ? (
                <VideoIcon className="w-12 h-12 text-blue-500" />
              ) : callState.callType === "audio" ? (
                <PhoneIcon className="w-12 h-12 text-green-500" />
              ) : null}
            </div>
          )}

          {callState.callType === "video" && (
            <div className="flex flex-col sm:flex-row w-full justify-center items-center gap-4">
              {showRemoteVideo && (
                <div className="relative w-full sm:w-1/2 aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <video
                    ref={remoteMediaRef as React.RefObject<HTMLVideoElement>}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {callState.initiaterId === user?.userId
                      ? callState.recipientName
                      : callState?.initiaterName}
                  </div>
                </div>
              )}
              {showLocalVideo && (
                <div className="relative w-full sm:w-1/2 aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <video
                    ref={localMediaRef as React.RefObject<HTMLVideoElement>}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    You
                  </div>
                </div>
              )}
            </div>
          )}

          {showAudio && (
            <div className="flex flex-col items-center space-y-8 w-full">
              <div className="flex justify-around items-center w-full max-w-2xl px-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mic className="w-12 h-12 text-blue-500" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium">You</span>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mic className="w-12 h-12 text-blue-500" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {callState.initiaterId === user?.userId
                      ? callState.recipientName
                      : callState?.initiaterName}
                  </span>
                </div>
              </div>
              <audio ref={localMediaRef} autoPlay muted hidden />
              <audio ref={remoteMediaRef} autoPlay hidden />
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          {callState.status === "ringing" &&
            callState.initiaterId !== user?.userId && (
              <div className="flex flex-col sm:flex-row w-full gap-3">
                <Button
                  onClick={answerCall}
                  variant="default"
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  Answer
                </Button>
                <Button
                  onClick={rejectCall}
                  variant="destructive"
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            )}
          {(callState.status === "connected" ||
            callState.initiaterId === user?.userId) && (
            <Button
              onClick={endCall}
              variant="destructive"
              className="w-full md:w-[60%] md:mx-auto"
            >
              End Call
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
