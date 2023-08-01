import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootStateTypes } from "../../redux/store";

interface UsersType {
  name: string;
  _id: string;
  picture: string;
}

export const ChatContent = () => {

  const {state}:{state:UsersType} = useLocation()
  const {message,sender} = useSelector((state:RootStateTypes) => state.ChatMsg);

  function truncateUsername(username: string): string {
    const maxLength = 7; // Define the maximum length for the truncated username
    if (username.length <= maxLength) {
      return username;
    }
    return username.substring(0, maxLength) + "...";
  }

 

  return (
    <>
      <div className=" text-white h-full md:w-[70%] break-all">

        <div className="chat chat-start">
          <div className="chat-header flex gap-3 md:text-sm">
            {truncateUsername(state.name)}
            <time className="text-xs md:text-sm opacity-50">2 hours ago</time>
          </div>
          <div className="chat-bubble md:text-lg">{message}</div>
          <div className="chat-footer opacity-50">Seen</div>
        </div>

        <div className="chat chat-end">
          <div className="chat-header flex gap-3 md:text-sm">
            Me
            <time className="text-xs md:text-sm opacity-50">2 hours ago</time>
          </div>
          <div className="chat-bubble md:text-lg">You were the Chosen One!</div>
          <div className="chat-footer opacity-50">Seen</div>
        </div>
        
      </div>
    </>
  );
};
