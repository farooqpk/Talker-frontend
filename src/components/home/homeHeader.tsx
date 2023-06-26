import { FaSearch } from "react-icons/fa";

export const HomeHeader = () => {
  return (
    <>
      <div className="flex mx-4 my-5 p-2 rounded-3xl h-1/2 md:h-2/3 border border-transparent bg-base-300">
        <div className="flex items-center mx-5">
          <FaSearch size={20} color={"gray"} />
        </div>
        <input
          type="search"
          placeholder="Search for users..."
          className=" bg-transparent outline-none w-full text-lg md:text-xl text-secondary"
        />
        <span className="loading loading-dots loading-sm text-white md:loading-md mx-2" />
      </div>
    </>
  );
};
