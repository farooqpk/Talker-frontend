import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { createAccessTokenFromRefreshToken } from "@/services/api/auth";
import { useNavigate } from "react-router-dom";

export const SocketContext = createContext<Socket | undefined>(undefined);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | undefined>();

  const connectSocket = () => {
    const newSocket: Socket = io({
      autoConnect: true,
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("connected");
    });

    newSocket.on("disconnect", () => {
      console.log("disconnected");
    });

    newSocket.on("unauthorized", async (reason) => {
      console.log(reason);
      try {
        await createAccessTokenFromRefreshToken();
        newSocket.connect();
      } catch (error) {
        console.log(error);
        navigate("/auth");
      }
    });

    setSocket(newSocket);

    return newSocket;
  };

  useEffect(() => {
    const newSocket = connectSocket();

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
