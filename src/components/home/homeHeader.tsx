import { FaSearch } from "react-icons/fa";

export const HomeHeader = () => {
  return (
    <>
      <div className="flex mx-4 my-5 p-2 rounded-2xl h-1/2 border border-transparent bg-base-300">
        <div className="flex items-center mx-5">
          <FaSearch size={20} color={"gray"} />
        </div>
        <input
          type="search"
          name=""
          id=""
          placeholder="Search for users..."
          className=" bg-transparent outline-none w-full text-lg text-secondary"
        />
        <span className="loading loading-ring text-white" />
      </div>
    </>
  );
};
