import axios from "axios";
import { useMutation } from "react-query";

interface LoginData {
  access_token: string;
  username: string;
}

export const useLoginPost = () => {
  return useMutation(async ({ access_token, username }: LoginData) => {
    try {
      return await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/login`,
        { username },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
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
  });
};
