import { FaMicrophone, FaLocationArrow } from "react-icons/fa";
import { MdAddCircleOutline } from "react-icons/md";

export const ChatFooter = () => {
  return (
    <div className="h-[60%] flex justify-evenly md:justify-center items-center w-full gap-1 md:gap-7 md:w-[70%]">
      <input type="file" id="fileInput" className="hidden" />
      <label
        htmlFor="fileInput"
        className="text-3xl md:text-4xl text-primary cursor-pointer"
      >
        <MdAddCircleOutline />
      </label>

      <textarea
        placeholder="Type something..."
        className="rounded-box bg-base-300 w-[60%] pl-2 p-1 md:p-5 pt-2 text-secondary md:text-lg outline-none resize-none"
      />

      <button className="text-xl md:text-2xl text-primary">
        <FaMicrophone />
      </button>

      <button className="text-primary text-xl md:text-2xl">
        <FaLocationArrow />
      </button>
    </div>
  );
};
