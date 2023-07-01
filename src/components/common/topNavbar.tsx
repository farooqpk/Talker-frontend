import { AiOutlinePhone, AiOutlineHome } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";

export const TopNavbar = () => {
  return (
    <div className="navbar bg-black rounded-box flex justify-evenly ">
      <div
        className="tooltip hover:tooltip-open tooltip-bottom tooltip-primary"
        data-tip="home"
      >
        <button className="text-primary">
          <AiOutlineHome size={30} />
        </button>
      </div>

      <div
        className="tooltip hover:tooltip-open tooltip-bottom tooltip-primary"
        data-tip="profile"
      >
        <button className="text-primary">
          <CgProfile size={30} />
        </button>
      </div>

      <div
        className="tooltip hover:tooltip-open tooltip-bottom tooltip-primary"
        data-tip="call"
      >
        <button className="text-primary">
          <AiOutlinePhone size={30} />
        </button>
      </div>
    </div>
  );
};
