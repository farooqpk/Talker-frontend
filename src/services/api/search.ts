import _axios from "@/lib/_axios";

export const getUsersForSearch = async (search?: string) => {
  return (await _axios.get(`/getUsersForSearch?search=${search}`)).data;
};
