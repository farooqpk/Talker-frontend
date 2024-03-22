import { Skeleton } from "./ui/skeleton";

const Loader = () => {
  return (
    <div className="h-screen flex flex-col gap-6 items-center justify-center absolute">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="w-[60%] h-[20px] rounded-full" />
      ))}
    </div>
  );
};

export default Loader;
