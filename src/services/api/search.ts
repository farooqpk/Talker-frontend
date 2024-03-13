import _axios from "@/lib/_axios";

export const getUsersForSearch = async (
  pageParam: any,
  searchInput?: string
) => {
  return (
    await _axios.get(
      `/getUsersForSearch?page=${pageParam}&search=${searchInput}`
    )
  ).data;
};
