import React, { createContext, useContext, useEffect, useState } from "react";
import { Peer } from "peerjs";
import { useSocket } from "./socketProvider";

export const PeerContext = createContext<Peer | undefined>(undefined);

export const usePeer = () => {
  return useContext(PeerContext);
};

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
  const [peer, setPeer] = useState<Peer | undefined>();
  const socket = useSocket();

  useEffect(() => {
    const newPeer = new Peer();

    newPeer.on("open", (peerId: string) => {
      console.log("PeerJS: Peer ID:", peerId);
      socket?.emit("storePeerId", peerId); // Emit peer ID to the server
    });

    newPeer.on("error", (error) => {
      console.error("Error in PeerJS:", error);
    });

    newPeer.on("disconnected", () => {
      console.log("PeerJS: Peer disconnected");
      setPeer(undefined);
      socket?.emit("removePeerId", newPeer.id);
    });

    setPeer(newPeer); // Set the new peer connection

    // Cleanup function
    return () => {
      if (newPeer && newPeer.open) {
        newPeer.disconnect();
        setPeer(undefined);
      }
    };
  }, [socket]); 

  return <PeerContext.Provider value={peer}>{children}</PeerContext.Provider>;
};
