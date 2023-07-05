import { FaSearch } from "react-icons/fa";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { useRandomUsersForSearchbar } from "../../hooks/search/useRandomUsersForSearchbar";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSearchUser } from "../../hooks/search/useSearchUser";
import useDebounce from "../../hooks/debounce/useDebounce";


interface UsersType {
  name: string;
  _id: string;
  picture: string;
}

export const HomeSearchBox = () => {
  const [isInputClick, setIsinputClick] = useState<boolean>(false);
  const randomUsers = useRandomUsersForSearchbar();
  const [searchInput, setSearchInput] = useState<string>("");
  // debounce hook
  const searchName = useDebounce(searchInput, 600);
  const searchedUsers = useSearchUser(searchName);

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    setSearchInput(event.currentTarget.value);
  };

  return (
    <>
      <div className="flex justify-center items-center flex-col w-full my-5 md:my-4 ">
        <div className="flex w-[80%] md:w-[40%] p-2 rounded-3xl h-full md:rounded-xl border border-transparent bg-black">
          <div className="flex items-center mx-5">
            <FaSearch size={17} color={"gray"} />
          </div>
          <input
            onClick={() => setIsinputClick(true)}
            onChange={handleInput}
            type="search"
            placeholder="Search for users..."
            className=" bg-transparent outline-none  w-full text-sm md:text-xl text-secondary"
          />

          {randomUsers.isLoading ||
            (searchedUsers.isLoading && (
              <span className="loading loading-dots loading-sm text-white md:loading-md mx-2" />
            ))}
        </div>
        {/*searchbar ends */}
        {/* randomUsersList or searchUsersList started*/}

        {isInputClick && (
          <div className="flex justify-center items-start z-10">
            <ul className="menu rounded-b-box menu-md md:menu-lg gap-2 md:gap-3 absolute bg-base-200 w-[75%] md:w-[40%] h-auto">
              
              <div className="flex justify-end p-1 md:p-2 ">
                <div className="w-1/12" onClick={() => setIsinputClick(false)}>
                  <AiOutlineCloseCircle className="hover:cursor-pointer hover:scale-[1.1] text-white" size={20}   />
                </div>
              </div>

              {searchedUsers.isError && (
                <div className="flex-1 mb-2 ">
                  <p className="text-md md:text-lg text-secondary text-center font-thin">
                    {(searchedUsers.error as any).message}
                  </p>
                </div>
              )}

              {searchedUsers.data?.data &&
                searchedUsers.data?.data.map(
                  (user: UsersType, index: number) => {
                    return (
                      <li key={index}>
                        <Link to={""} className="flex items-center space-x-5">
                          <img
                            src={user.picture}
                            alt="img"
                            className="w-[11%] md:w-[6%] avatar rounded-full"
                          />
                          <p className="text-secondary font-sans text-md">
                            {user.name}
                          </p>
                        </Link>
                      </li>
                    );
                  }
                )}

              {searchInput === "" &&
                randomUsers &&
                randomUsers.data?.data.map((user: UsersType, index: number) => {
                  return (
                    <li key={index}>
                      <Link to={""} className="flex items-center space-x-5">
                        <img
                          src={user.picture}
                          alt="img"
                          className="w-[11%] md:w-[6%] avatar rounded-full"
                        />
                        <p className="text-secondary font-sans text-md">
                          {user.name}
                        </p>
                      </Link>
                    </li>
                  );
                })}

            </ul>
          </div>
        )}
      </div>
    </>
  );
};
