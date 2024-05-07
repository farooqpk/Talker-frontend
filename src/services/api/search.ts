import _axios from "@/lib/_axios";

export const getUsersForSearch = async () => {
  return (await _axios.get(`/getUsersForSearch`)).data;
};
