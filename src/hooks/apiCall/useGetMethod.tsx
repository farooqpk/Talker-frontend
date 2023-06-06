import axios from "axios";
import { useQuery } from "react-query";

export const useGetMethod = (
  fetchId: string,
  endpoint: string,
  headers?:any
) => {
  return useQuery(
    [fetchId],
    async () => {
      try {
        return await axios.get(
          `${import.meta.env.VITE_SERVER_URL}${endpoint}`,
          {
            headers: {
             ...headers
            },
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
    {}
  );
};
