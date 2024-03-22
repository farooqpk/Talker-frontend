import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { useInfiniteQuery } from "react-query";
import { getUsersForSearch } from "@/services/api/search";
import { useState } from "react";
import { debounce } from "@/lib/debounce";
import { useNavigate } from "react-router-dom";

const HomeHeader = () => {
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["randomusersforsearch", searchInput],
      queryFn: ({ pageParam }) =>
        getUsersForSearch(pageParam || 1, searchInput),
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length ? allPages.length + 1 : undefined;
      },
      keepPreviousData: true,
    });

  const userList = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Messages</h1>
      <Popover>
        <PopoverTrigger>
          <div className="relative flex items-center max-w-2xl w-full">
            <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search for users"
              className="pl-8 rounded-xl bg-slate-900"
              onChange={(e) =>
                debounce(() => setSearchInput(e.target.value), 1000)()
              }
              type="text"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <ScrollArea
            className={`${userList.length <= 2 ? "h-[100px]" : "h-[200px]"}`}
          >
            <div className="flex flex-col gap-3 p-3">
              {userList.map((user) => (
                <Button
                  key={user.userId}
                  variant="ghost"
                  onClick={() => navigate(`/chat/${user.userId}`)}
                >
                  {user.username}
                </Button>
              ))}
              {userList.length > 0 && (
                <Button
                  onClick={() => fetchNextPage()}
                  size={"sm"}
                  variant={"outline"}
                  disabled={!hasNextPage || isFetchingNextPage}
                >
                  {isFetchingNextPage
                    ? "Loading..."
                    : hasNextPage
                    ? "Load More"
                    : "Nothing more to load"}
                </Button>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default HomeHeader;
