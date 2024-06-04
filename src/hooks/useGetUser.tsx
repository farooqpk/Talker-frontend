import { User } from "@/types/index";

export const useGetUser = () => {
  const user = localStorage.getItem("user");

  if (user !== null && user !== "undefined") {
    return { user: JSON.parse(user) as User };
  }
  return { user: null };
};
