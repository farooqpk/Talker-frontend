import { truncateUsername } from "@/lib/trunctuate";
import { User, UserStatusEnum } from "../common/types";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export const PersonalChatHeader = ({
  recipient,
  userStatus,
}: {
  recipient: User;
  userStatus: UserStatusEnum;
}) => {
  return (
    <>
      <div className="flex items-center p-3 border-b rounded-xl ">
        <Link to={`/`} className="absolute">
          <Button variant={"outline"} size={"icon"}>
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex flex-col md:gap-2 mx-auto">
          <p className="text-lg truncate font-semibold">
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
    </>
  );
};
