import axios from "axios";
import { useMutation } from "react-query";

const apiCall = async (data: any, endpoint: string) => {
  try {
    const response = await axios.post(
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
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const usePostMethod = (endpoint: string, postData: any) => {
  return useMutation(
    async () => {
      return await apiCall(postData, endpoint);
    }
    // { onSuccess: (data) => console.log(data) }
  );
};
