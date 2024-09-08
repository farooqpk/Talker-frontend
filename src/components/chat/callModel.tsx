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
    if (localMediaRef.current && callState.localStream) {
      localMediaRef.current.srcObject = callState.localStream;
    }

    if (remoteMediaRef.current && callState.remoteStream) {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            {callState.status === "ringing"
              ? callState.initiaterId === user?.userId
                ? "Calling..."
                : `Incoming ${callState.callType} call from ${callState?.initiaterName}`
              : "..."}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          {callState.status === "ringing" &&
            callState.initiaterId !== user?.userId && (
              <div className="flex items-center justify-center mb-4">
                {callState.callType === "video" ? (
                  <VideoIcon className="w-12 h-12 text-blue-500" />
                ) : (
                  <PhoneIcon className="w-12 h-12 text-green-500" />
                )}
              </div>
            )}

          {callState.callType === "video" && (
            <div className="flex justify-around mt-4 space-x-4">
              {showLocalVideo && (
                <div className="relative w-1/2 aspect-video bg-gray-200 rounded-lg overflow-hidden">
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
              {showRemoteVideo && (
                <div className="relative w-1/2 aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <video
                    ref={remoteMediaRef as React.RefObject<HTMLVideoElement>}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {callState?.initiaterName}
                  </div>
                </div>
              )}
            </div>
          )}

          {showAudio && (
            <div className="flex justify-center items-center space-x-4">
              <Mic className="w-8 h-8 text-blue-500" />
              <div className="text-lg">Audio call connected</div>
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
        <DialogFooter>
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
            <Button onClick={endCall} variant="destructive" className="w-full">
              End Call
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
