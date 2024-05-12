import _axios from "@/lib/_axios";

export const findUserApi = async (userId: string) => {
  return (await _axios.get(`/api/user/${userId}`)).data;
};
