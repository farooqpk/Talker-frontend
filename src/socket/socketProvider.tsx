import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import _axios from "@/lib/_axios";
import Cookies from "js-cookie";

export const SocketContext = createContext<Socket | undefined>(undefined);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>(
    Cookies.get("accesstoken") || undefined
  );

  useEffect(() => {
    const accessTokenInterval = setInterval(() => {
      const newAccessToken = Cookies.get("accesstoken");
      if (newAccessToken !== accessToken) {
        setAccessToken(newAccessToken);
      }
    }, 2000);

    return () => clearInterval(accessTokenInterval);
  }, [accessToken]);

  useEffect(() => {
    const connectSocket = () => {
      if (accessToken) {
        const newSocket: Socket = io(import.meta.env.VITE_API_URL, {
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

        newSocket.on("unauthorized", (reason) => {
          console.log(reason);
          newSocket.connect();
        });

        setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      }
    };

    connectSocket(); // Initial connection
  }, [accessToken]); // useEffect triggers when accessToken changes

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
