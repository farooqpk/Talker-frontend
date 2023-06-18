import axios from "axios";
import { useMutation } from "react-query";

interface SignupData {
  access_subId: string;
  username: string;
}

export const useSignupPost = () => {
  return useMutation(async ({ access_subId, username }: SignupData) => {
    try {
      return await axios.post( 
        `${import.meta.env.VITE_SERVER_URL}/signup`,
        { username },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_subId}`,
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
