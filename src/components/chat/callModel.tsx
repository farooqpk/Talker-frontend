import React, { useEffect, useRef } from "react";
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
  const localMediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const remoteMediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const { user } = useGetUser();

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
    callState.callType,
    callState.localStream,
    callState.remoteStream,
  ]);

  const showLocalVideo =
    callState.callType === "video" &&
    callState.localStream &&
    (callState.initiaterId === user?.userId ||
      callState.status === "connected");

  const showRemoteVideo =
    callState.callType === "video" &&
    callState.status === "connected" &&
    callState.remoteStream;

  const showAudio =
    callState.callType === "audio" && callState.status === "connected";

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
          <DialogTitle className="text-lg md:text-xl sm:text-base font-bold text-center">
            {(() => {
              if (
                callState.status === "initiating" ||
                callState.status === "ringing"
              ) {
                if (callState.initiaterId === user?.userId) {
                  return callState.status === "initiating"
                    ? `Calling ${callState.recipientName}...`
                    : `Ringing ${callState.recipientName}...`;
                } else {
                  return `Incoming ${callState.callType} call from ${callState?.initiaterName}`;
                }
              }
              return `${callState.callType} call`;
            })()}
          </DialogTitle>
        </DialogHeader>

        {!callState.recipientPeerId &&
          callState.initiaterId === user?.userId && (
            <p className="text-warning text-sm text-center">User is offline</p>
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
            <div className="flex flex-col items-center space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative flex flex-col items-center">
                  <Mic className="w-8 h-8 text-blue-500" />
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  </div>
                  <span className="mt-2 text-sm">You</span>
                </div>

                <div className="relative flex flex-col items-center">
                  <Mic className="w-8 h-8 text-blue-500" />
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  </div>
                  <span className="mt-2 text-sm">
                    {callState.initiaterId === user?.userId
                      ? callState.recipientName
                      : callState?.initiaterName}
                  </span>
                </div>
              </div>

              <audio
                ref={localMediaRef as React.RefObject<HTMLAudioElement>}
                autoPlay
                muted
              />
              <audio
                ref={remoteMediaRef as React.RefObject<HTMLAudioElement>}
                autoPlay
              />
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
