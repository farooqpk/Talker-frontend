import { SearchIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { useInfiniteQuery } from "react-query";
import { getUsersForSearch } from "@/services/api/search";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useEffect, useState } from "react";
import { debounce } from "@/lib/debounce";
import { useInView } from "react-intersection-observer";
import { ThreeDots } from "react-loader-spinner";

const HomeHeader = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isSearchClicked, setIsSearchClicked] = useState(false);
  const { inView, ref } = useInView();

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["randomusersforsearch", search],
      queryFn: ({ pageParam = 1 }) => getUsersForSearch(search, pageParam),
      getNextPageParam: (lastPage, allPage) => {
        const nextPage =
          lastPage?.length === 6 ? allPage.length + 1 : undefined;
        return nextPage;
      },
      keepPreviousData: true,
      enabled: !!isSearchClicked,
    });

  const handleSearch = (value: string) => {
    debounce(() => setSearch(value), 500)();
  };

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, isFetchingNextPage, fetchNextPage, hasNextPage]);

  return (
    <section className="mx-auto">
      <Popover
        open={isSearchClicked}
        onOpenChange={(val) => setIsSearchClicked(val)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="searchbox"
            className="w-[250px] md:w-[300px] justify-between rounded-xl"
            onClick={() => setIsSearchClicked(true)}
          >
            Search for users...
            <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] md:w-[300px] p-0">
          <Command>
            <CommandInput onValueChange={handleSearch} />
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {data?.pages.flatMap((page) => {
                return page?.map((item: any, i: number) => (
                  <CommandItem
                    key={i}
                    value={item}
                    onSelect={() => {
                      navigate(`/chat/${item.value}`);
                    }}
                    className="cursor-pointer my-2"
                  >
                    {item.label}
                  </CommandItem>
                ));
              })}

              {data?.pages?.[0]?.length > 0 && <div ref={ref} />}
              {isFetchingNextPage && (
                <div className="flex justify-center">
                  <ThreeDots color="#E5E7EB" height={30} width={40} />
                </div>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </section>
  );
};

export default HomeHeader;
