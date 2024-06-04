import { User } from "@/types/index";

export const useGetUser = () => {
  const user = localStorage.getItem("user");

  return {
    user: user ? (JSON.parse(user) as User) : null,
  };
};
