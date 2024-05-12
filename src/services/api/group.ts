import _axios from "@/lib/_axios";

export const getPublicKeysApi = async (
  data: any
): Promise<Array<{ userId: string; publicKey: string }>> => {
  return (await _axios.post(`/api/user/get-public-keys`, data)).data;
};

export const createGroupApi = async (data: any) => {
  return (await _axios.post(`/api/group/create-group`, data)).data;
};

export const getGroupDetailsApi = async (groupId: string) => {
  return (await _axios.get(`/api/group/${groupId}`)).data;
};

export const groupIdsApi = async () => {
  return (await _axios.get(`/api/group/groupIds`)).data;
};
