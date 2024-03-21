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
import { UserStatusEnum } from "@/components/common/types";

export const ChatHome = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const [userStatus, setUserStatus] = useState<UserStatusEnum>(
    UserStatusEnum.OFFLINE
  );

  const { data: user, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  useEffect(() => {
    if (!socket) return;

    const handleIsOnline = (
      status: UserStatusEnum.OFFLINE | UserStatusEnum.ONLINE
    ) => {
      setUserStatus(status);
    };

    const handleIsDisconnected = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.OFFLINE);
      }
    };

    const handleIsConnected = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.ONLINE);
      }
    };

    const handleIsTyping = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.TYPING);
      }
    };

    const handleIsNotTyping = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.ONLINE);
      }
    };

    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    socket.on("isTyping", handleIsTyping);

    socket.on("isNotTyping", handleIsNotTyping);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
      socket.off("isTyping", handleIsTyping);
      socket.off("isNotTyping", handleIsNotTyping);
    };
  }, [id, socket]);

  const handleTyping = (value: string) => {
    if (!socket) return;
    if (value.length > 0) {
      socket.emit("isTyping", { toUserId: id });
    } else {
      socket.emit("isNotTyping", { toUserId: id });
    }
  };

  return (
    <>
      <main className="h-screen flex flex-col">
        {(isLoading && <Loader />) || (!socket && <Loader />)}
        {user && (
          <>
            <ChatHeader user={user} userStatus={userStatus} />

            <ChatContent />

            <ChatFooter handleTyping={handleTyping} />
          </>
        )}
      </main>
    </>
  );
};
