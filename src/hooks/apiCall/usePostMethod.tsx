import axios from "axios";
import { useMutation } from "react-query";


export const usePostMethod = (endpoint: string) => {

  return useMutation(async (data: string) => {
   try {

    return await axios.post(
      `${import.meta.env.VITE_SERVER_URL}${endpoint}`,
      {
        data,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
   } catch (error:any) {
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
