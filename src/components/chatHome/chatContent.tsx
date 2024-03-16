export const ChatContent = () => {
  return (
    <>
      <div className=" text-white h-full md:w-[70%] break-all">
        <div className="chat chat-start mt-3">
          <div className="chat-header flex gap-3 md:text-sm">
            <time className="text-xs md:text-sm opacity-50">2 hours ago</time>
          </div>
          <div className="chat-bubble md:text-lg">hai</div>

          <div className="chat-footer opacity-50">Seen</div>
        </div>

        <div className="chat chat-end mt-3">
          <div className="chat-header flex gap-3 md:text-sm">
            Me
            <time className="text-xs md:text-sm opacity-50">2 hours ago</time>
          </div>
          <div className="chat-bubble md:text-lg">hello</div>
          <div className="chat-footer opacity-50">Seen</div>
        </div>
      </div>
    </>
  );
};
