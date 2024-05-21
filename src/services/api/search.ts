import _axios from "@/lib/_axios";

export const getUsersForSearch = async (search: string = "", page: number) => {
  return (
    await _axios.get(
      `/api/user/getUsersForSearch?search=${search}&page=${page}`
    )
  ).data;
};
