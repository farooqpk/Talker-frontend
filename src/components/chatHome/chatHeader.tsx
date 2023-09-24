import { BiArrowBack } from "react-icons/bi";
import { IoMdCall } from "react-icons/io";
import { FaVideo } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSocket } from "../../socket/socketProvider";

interface UsersType {
  name: string;
  _id: string;
  picture: string;
}

export const ChatHeader = () => {
  const { state }: { state: UsersType } = useLocation();
  const socket = useSocket();
  const [recipientStatus, setRecipientStatus] = useState<string>("offline");

  useEffect(() => {
    socket?.emit("status", state._id);

    socket?.on("status", (data: { status: string }) => {
      setRecipientStatus(data.status);
    });
    return () => {
      socket?.off("status");
    };
  }, [socket]);

  function truncateUsername(username: string) {
    const maxLength = 10; // Define the maximum length for the truncated username
    if (username.length <= maxLength) {
      return username;
    }
    return username.substring(0, maxLength) + "...";
  }

  return (
    <>
      <div className="bg-black h-full flex justify-around items-center rounded-box md:w-[70%]">
        <Link to={"/home"}>
          <div className="text-white text-xl md:text-2xl hover:scale-[0.9] font-bold">
            <BiArrowBack />
          </div>
        </Link>

        <div className="flex items-center gap-6 hover:scale-[0.99]">
          <div className="w-11 md:w-14">
            <img
              className="rounded-full hover:scale-[0.95]"
              src={state.picture}
              alt="Tailwind-CSS-Avatar-component"
            />
          </div>

          <div className="flex flex-col md:gap-2">
            <p className="text-white text-lg truncate md:hidden">
              {truncateUsername(state.name)}
            </p>
            <p className="text-white text-xl md:block hidden md:font-semi-bold">
              {state.name}
            </p>
            {recipientStatus === "online" ? (
              <span className="text-sm md:text-sm text-success">
                {recipientStatus}
              </span>
            ) : (
              <span className="text-sm md:text-sm text-error">
                {recipientStatus}
              </span>
            )}
          </div>
        </div>

        <div className="text-white text-xl md:text-2xl hover:scale-[0.9]">
          <FaVideo />
        </div>
        <div className="text-white text-xl md:text-2xl hover:scale-[0.9]">
          <IoMdCall />
        </div>
      </div>
    </>
  );
};
