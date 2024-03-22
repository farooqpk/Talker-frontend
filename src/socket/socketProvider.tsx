import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import _axios from "@/lib/_axios";
import Cookies from "js-cookie";

export const SocketContext = createContext<Socket | undefined>(undefined);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket>();
  const accessToken = Cookies.get("accesstoken");

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const newSocket: Socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      autoConnect: true,
      auth: {
        token: accessToken,
      },
    });

    newSocket.on("connect", () => {
      console.log("connected");
    });

    newSocket.on("disconnect", () => {
      console.log("disconnected");
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={socket as Socket}>
      {children}
    </SocketContext.Provider>
  );
};
