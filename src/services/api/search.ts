import _axios from "@/lib/_axios";

export const getUsersForSearch = async (search: string = '') => {
  return (await _axios.get(`/api/user/getUsersForSearch?search=${search}`)).data;
};
