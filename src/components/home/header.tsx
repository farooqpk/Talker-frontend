import { SearchIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { useQuery } from "react-query";
import { getUsersForSearch } from "@/services/api/search";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

const HomeHeader = () => {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["randomusersforsearch"],
    queryFn: getUsersForSearch,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="searchbox"
          className="w-[200px] justify-between rounded-xl"
        >
          Search for users...
          <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 max-h-[300px] overflow-y-auto">
        <Command>
          <CommandInput />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {data?.map((item:any, i: number) => (
              <CommandItem
                key={i}
                value={item.value}
                onSelect={() => {
                  navigate(`/chat/${item.value}`);
                }}
                className="cursor-pointer"
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default HomeHeader;
