import _axios from "@/lib/_axios";

export const getMessagesApi = async (chatId: string) => {
  return (await _axios.get(`/api/message/messages/${chatId}`)).data;
};

export const getChatListApi = async (page: number) => {
  return (await _axios.get(`/api/chat/chat-list?page=${page}`)).data;
};

export const getChatKeyApi = async (chatId: string) => {
  return (await _axios.get(`/api/chat/get-chat-key/${chatId}`)).data;
};
