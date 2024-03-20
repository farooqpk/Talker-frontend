import { BiArrowBack } from "react-icons/bi";
import { Link } from "react-router-dom";
import { truncateUsername } from "@/lib/trunctuate";
import { Button } from "../ui/button";
import { MoveLeft, Phone, Video } from "lucide-react";

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
          <Button variant="ghost" size="icon" className="rounded-full p-2">
            <MoveLeft />
          </Button>
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
          <Button variant="ghost" size="icon" className="rounded-full p-2">
            <Video />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full p-2">
            <Phone />
          </Button>
        </div>
      </div>
    </>
  );
};
