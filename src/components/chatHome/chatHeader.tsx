import { Link } from "react-router-dom";
import { truncateUsername } from "@/lib/trunctuate";
import { Button } from "../ui/button";
import { MoveLeft, Phone, Video } from "lucide-react";
import { User, UserStatusEnum } from "../common/types";

export const ChatHeader = ({
  recipient,
  userStatus,
  handleClickCallButton,
}: {
  recipient: User;
  userStatus: UserStatusEnum;
  handleClickCallButton: (type: "voice-call" | "video-call") => void;
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
              {truncateUsername(recipient.username)}
            </p>
            {userStatus === UserStatusEnum.ONLINE ? (
              <span className="text-sm md:text-sm text-success">Online</span>
            ) : userStatus === UserStatusEnum.OFFLINE ? (
              <span className="text-sm md:text-sm text-error">Offline</span>
            ) : userStatus === UserStatusEnum.TYPING ? (
              <span className="text-sm md:text-sm text-warning">Typing...</span>
            ) : null}
          </div>
        </div>

        <div className="text-xl md:text-2xl flex gap-10 md:gap-14">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-2"
            onClick={() => handleClickCallButton("video-call")}
          >
            <Video />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-2"
            onClick={() => handleClickCallButton("voice-call")}
          >
            <Phone />
          </Button>
        </div>
      </div>
    </>
  );
};
