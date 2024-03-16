import { BiArrowBack } from "react-icons/bi";
import { IoMdCall } from "react-icons/io";
import { FaVideo } from "react-icons/fa";
import { Link } from "react-router-dom";
import { truncateUsername } from "@/lib/trunctuate";

type User = {
  userId: string;
  username: string;
};

export const ChatHeader = ({
  user,
  userStatus,
}: {
  user: User;
  userStatus: "online" | "offline";
}) => {
  return (
    <>
      <div className="flex justify-around items-center p-3 border-b rounded-xl ">
        <Link to={"/"}>
          <div className="text-xl md:text-2xl hover:scale-[0.9] font-bold">
            <BiArrowBack />
          </div>
        </Link>

        <div className="flex items-center gap-6 ">
          <div className="flex flex-col md:gap-2">
            <p className="text-lg truncate">
              {truncateUsername(user.username)}
            </p>
            {userStatus === "online" ? (
              <span className="text-sm md:text-sm text-success">Online</span>
            ) : (
              <span className="text-sm md:text-sm text-error">Offline</span>
            )}
          </div>
        </div>

        <div className="text-xl md:text-2xl flex gap-10 md:gap-14">
          <div className="hover:scale-[0.9]">
            <FaVideo />
          </div>
          <div className="hover:scale-[0.9]">
            <IoMdCall />
          </div>
        </div>
      </div>
    </>
  );
};
