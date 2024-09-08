import React, { createContext, useContext, useState, useEffect } from "react";
import Peer from "peerjs";
import { useSocket } from "./socketProvider";
import { SocketEvents } from "@/types";

const PeerContext = createContext<Peer | null>(null);

export const usePeer = () => useContext(PeerContext);

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const newPeer = new Peer();

    newPeer.on("open", (id) => {
      console.log("My peer ID is: " + id);
      setPeer(newPeer);
      socket.emit(SocketEvents.SET_PEER_ID, id);
    });

    newPeer.on("connection", (conn) => {
      console.log("Connected to peer:", conn.peer);
    });

    newPeer.on("disconnected", () => {
      console.log("Disconnected from peer");
      setPeer(null);
      socket.emit(SocketEvents.SET_PEER_ID, null);
    });

    newPeer.on("error", (err) => {
      console.error("Peer error:", err);
      setPeer(null);
      socket.emit(SocketEvents.SET_PEER_ID, null);
    });

    newPeer.on("close", () => {
      console.log("Peer closed");
      setPeer(null);
      socket.emit(SocketEvents.SET_PEER_ID, null);
    });

    newPeer.on("call", (call) => {
      console.log(call.metadata);
      console.log("Received a call from:", call.peer);
    });

    return () => {
      newPeer.destroy();
      setPeer(null);
      socket.emit(SocketEvents.SET_PEER_ID, null);
    };
  }, [socket]);

  return <PeerContext.Provider value={peer}>{children}</PeerContext.Provider>;
};
