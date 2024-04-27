import { User } from "@/components/common/types";

export const useGetUser = () => {
  const user = localStorage.getItem("user");
  const publicKey = localStorage.getItem("publicKey");
  const privateKey = localStorage.getItem("privateKey");
  const symetricKey = localStorage.getItem("symetricKey");

  return {
    user: user ? (JSON.parse(user) as User) : null,
    publicKey: publicKey ? publicKey : null,
    privateKey: privateKey ? privateKey : null,
    symetricKey: symetricKey ? symetricKey : null,
  };
};
