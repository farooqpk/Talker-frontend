import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootStateTypes } from "../../redux/store";

interface UsersType {
  name: string;
  _id: string;
  picture: string;
}

export const ChatContent = () => {
  const { state }: { state: UsersType } = useLocation();
  const { message, sender } = useSelector(
    (state: RootStateTypes) => state.ChatMsg
  );
  const { myMessage } = useSelector((state: RootStateTypes) => state.MyOwnMsg);

  return (
    <>
      <div className=" text-white h-full md:w-[70%] break-all">
        {message.length > 0 &&
          message.map((msg, index) => {
            return (
              <div className="chat chat-start mt-3" key={index}>
                <div className="chat-header flex gap-3 md:text-sm">
                  <time className="text-xs md:text-sm opacity-50">
                    2 hours ago
                  </time>
                </div>
                <div className="chat-bubble md:text-lg">{msg}</div>

                <div className="chat-footer opacity-50">Seen</div>
              </div>
            );
          })}

        {myMessage.length > 0 &&
          myMessage.map((myMsg, index) => {
            return (
              <div className="chat chat-end mt-3" key={index}>
                <div className="chat-header flex gap-3 md:text-sm">
                  Me
                  <time className="text-xs md:text-sm opacity-50">
                    2 hours ago
                  </time>
                </div>
                <div className="chat-bubble md:text-lg">{myMsg}</div>
                <div className="chat-footer opacity-50">Seen</div>
              </div>
            );
          })}
      </div>
    </>
  );
};
