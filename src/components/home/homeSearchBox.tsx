import { FaSearch } from "react-icons/fa";

export const HomeSearchBox = () => {
  return (
    <>
      <div className="flex justify-center w-full my-5  md:my-4">
        <div className="flex w-[80%] md:w-[40%] p-2 rounded-3xl h-full md:rounded-xl border border-transparent bg-black ">
          <div className="flex items-center mx-5">
            <FaSearch size={17} color={"gray"} />
          </div>
          <input
            type="search"
            placeholder="Search for users..."
            className=" bg-transparent outline-none  w-full text-sm md:text-xl text-secondary"
          />
          <span className="loading loading-dots loading-sm text-white md:loading-md mx-2" />
        </div>
      </div>
      {/* <div className="flex justify-center w-full md:w-[40%] my-5">
        <div className="flex w-[80%] md:w-[90%] p-2 rounded-3xl md:rounded-xl h-3/4 border border-transparent bg-black ">
          <div className="flex items-center mx-5">
            <FaSearch size={17} color={"gray"} />
          </div>
          <input
            type="search"
            placeholder="Search for users..."
            className=" bg-transparent outline-none  w-full text-sm md:text-xl text-secondary"
          />
          <span className="loading loading-dots loading-sm text-white md:loading-md mx-2" />
        </div>
      </div> */}
    </>
  );
};
