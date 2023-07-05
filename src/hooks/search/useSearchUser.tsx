import axios from "axios";
import { useQuery } from "react-query";

export const useSearchUser = (searchName: string) => {
  return useQuery(
    ["searchuser", searchName],
    async () => {
      try {
        return await axios.get(
          `${
            import.meta.env.VITE_SERVER_URL
          }/searchUser?userName=${searchName}`,
          {
            withCredentials: true,
          }
        );
      } catch (error: any) {
        if (error.response) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error(
            "Check your internet connection,or please try again later"
          );
        }
      }
    },
    {
     enabled:!!searchName,
     staleTime: 0,
     retry:false
    }
  );
};
