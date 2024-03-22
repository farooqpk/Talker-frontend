import { CircleEllipsis } from "lucide-react";
import { Button } from "../ui/button";

const HomeAddButton = () => {
  return (
    <div className="absolute bottom-10">
      <Button variant={"ghost"} className="rounded-full p-2">
        <CircleEllipsis className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default HomeAddButton;
