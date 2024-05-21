import { Skeleton } from "./ui/skeleton";

const Loader = ({ length = 10 }: { length?: number }) => {
  return (
    <div className="absolute inset-0 flex flex-col gap-6 items-center justify-center">
      {Array.from({ length }).map((_, i) => (
        <Skeleton key={i} className="w-[70%] h-[20px] rounded-full" />
      ))}
    </div>
  );
};

export default Loader;
