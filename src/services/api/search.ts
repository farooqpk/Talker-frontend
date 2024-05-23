import _axios from "@/lib/_axios";

export const getUsersForSearch = async ({
  search = "",
  page = 0,
  isInfiniteScroll = true,
}: {
  search?: string;
  page?: number;
  isInfiniteScroll?: boolean;
}) => {
  return (
    await _axios.get(
      `/api/user/getUsersForSearch?search=${search}&page=${page}&isInfiniteScroll=${isInfiniteScroll}`
    )
  ).data;
};
