import { ReactElement } from "react";
import { ChatContent } from "../../components/chatHome/chatContent";
import { ChatFooter } from "../../components/chatHome/chatFooter";
import { ChatHeader } from "../../components/chatHome/chatHeader";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { findUserApi } from "@/services/api/user";
import Loader from "@/components/loader";
import { useSocket } from "@/socket/socketProvider";
import { useEffect, useState } from "react";

export const ChatHome = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const [userStatus, setUserStatus] = useState<"online" | "offline">("offline");

  const { data: user, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  useEffect(() => {
    if (!socket) return;

    const handleIsOnline = (status: "online" | "offline") => {
      setUserStatus(status);
    };

    const handleIsDisconnected = (userId: string) => {
      if (userId === id) {
        setUserStatus("offline");
      }
    };

    const handleIsConnected = (userId: string) => {
      if (userId === id) {
        setUserStatus("online");
      }
    };

    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
    };
  }, [id, socket]);

  return (
    <>
      <main className="h-screen flex flex-col">
        {(isLoading && <Loader />) || (!socket && <Loader />)}
        {user && (
          <>
            <ChatHeader user={user} userStatus={userStatus} />

            <ChatContent />

            <ChatFooter />
          </>
        )}
      </main>
    </>
  );
};
