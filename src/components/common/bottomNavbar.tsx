import { AiOutlinePhone, AiOutlineHome } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { useLocation } from "react-router-dom";

export const BottomNavbar = () => {
  const location = useLocation();

  return (
    <>
      <div className="btm-nav bg-black rounded-box">
        {location.pathname !== "/home" && (
          <button className="text-primary hover:active hover:bg-black">
            <AiOutlineHome size={21} />
          </button>
        )}
        {location.pathname !== "/profile" && (
          <button className="text-primary hover:active hover:bg-black">
            <CgProfile size={21} />
          </button>
        )}
        {location.pathname !== "/callList" && (
          <button className="text-primary hover:active hover:bg-black">
            <AiOutlinePhone size={21} />
          </button>
        )}
      </div>
    </>
  );
};
