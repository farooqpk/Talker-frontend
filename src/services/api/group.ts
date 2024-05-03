import _axios from "@/lib/_axios";

export const findUsersToCreateGroupApi = async () => {
  return (await _axios.get(`/find-users-for-create-group`)).data;
};

export const getPublicKeysApi = async (
  data: any
): Promise<Array<{ userId: string; publicKey: string }>> => {
  return (await _axios.post(`/get-public-keys`, data)).data;
};

export const createGroupApi = async (data: any) => {
  return (await _axios.post(`/create-group`, data)).data;
};

export const getGroupDetailsApi = async (groupId: string) => {
  return (await _axios.get(`/group/${groupId}`)).data;
};

export const groupIdsApi = async () => {
  return (await _axios.get(`/groupIds`)).data;
};
