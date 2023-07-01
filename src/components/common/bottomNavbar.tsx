import { AiOutlinePhone, AiOutlineHome } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";

export const BottomNavbar = () => {
  return (
    <>
      <div className="btm-nav bg-black rounded-box">
        <button className="text-primary hover:active hover:bg-black">
          <AiOutlineHome size={21} />
        </button>
        <button className="text-primary hover:active hover:bg-black">
          <CgProfile size={21} />
        </button>
        <button className="text-primary hover:active hover:bg-black">
          <AiOutlinePhone size={21} />
        </button>
      </div>
    </>
  );
};
