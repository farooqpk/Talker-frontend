import _axios from "@/lib/_axios";

export const signup = async (data: { username: string; password: string, publicKey: string }) => {
  return (await _axios.post(`/auth/signup`, data)).data;
};

export const login = async (data: { username: string; password: string }) => {
  return (await _axios.post(`/auth/login`, data)).data;
};

export const verifyRouteApiReq = async (): Promise<any> => {
  return await _axios.get(`/auth/verifyRoute`);
};
