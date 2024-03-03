import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Cookie from "js-cookie";
import _axios from "@/lib/_axios";

export const SocketContext = createContext<Socket | undefined>(undefined);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    // const accessToken = Cookie.get("accesstoken");
    // if (!accessToken) {
    //   sampleFunctionForGettingAccessToken().then((res) => {
    //     console.log(res);
    //   });
    // } 
    const newSocket: Socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

async function sampleFunctionForGettingAccessToken() {
  return (await _axios.get("/")).data;
}
