import { User } from "@/components/common/types";

export const useGetUser = () => {
  const user = localStorage.getItem("user");
  if (user) return { user: JSON.parse(user) as User };
  return { user: null };
};
