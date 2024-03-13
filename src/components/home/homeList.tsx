import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const HomeList = (): ReactElement => {
  return (
    <>
      <div className="md:w-[60%] mx-auto flex flex-col gap-3">
        <Link to={"/"}>
          <div className="flex justify-between p-3 hover:bg-slate-950 rounded-2xl">
            <div className="flex items-center">
              <Avatar>
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col gap-2 justify-evenly items-center">
              <h2 className="text-sm md:text-xl">fjjfej</h2>
              <span className="text-secondary text-xs md:text-lg">hai..</span>
            </div>
            <div className="flex flex-col items-center gap-2 justify-evenly">
              <span className="text-secondary text-xs md:text-lg">
                10:30 am
              </span>

              <Badge variant={"outline"}>3</Badge>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
};
