import _axios from "@/lib/_axios";

export const findUserApi = async (userId: string) => {
  return (await _axios.get(`/api/user/${userId}`)).data;
};

export const isAnyGroupAdminApi = async (
  userId: string
): Promise<{
  isAnyGroupAdmin: boolean;
  groupsHaveNoRemainingAdmins: string | null;
  doAllGroupsHaveRemainingAdmins: boolean;
}> => {
  return (await _axios.get(`/api/user/is-any-group-admin/${userId}`)).data;
};

export const deleteAccountApi = async (_data: {}) => {
  return (await _axios.delete(`/api/user/delete-account`)).data;
};
