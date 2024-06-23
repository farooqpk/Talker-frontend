import _axios from "@/lib/_axios";
import axios from "axios";

export const getMessagesApi = async (chatId: string) => {
  return (await _axios.get(`/api/message/messages/${chatId}`)).data;
};

export const getChatListApi = async () => {
  return (await _axios.get(`/api/chat/chat-list`)).data;
};

export const getChatKeyApi = async (chatId: string) => {
  return (await _axios.get(`/api/chat/get-chat-key/${chatId}`)).data;
};

export const uploadToSignedUrlApi = async (data: {
  content: ArrayBuffer;
  url: string;
}) => {
  return await axios.put(data.url, data.content, {
    withCredentials: false,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
};

export const getSignedUrlApi = async (data: {
  filesize: number;
}): Promise<{ url: string; uniqueKey: string }> => {
  return (await _axios.post("/api/chat/get-signed-url", data)).data;
};

export const getMediaApi = async (mediapath: string): Promise<ArrayBuffer> => {
  const res = await _axios.get(`/api/message/get-media/${mediapath}`, {
    responseType: "arraybuffer",
    headers: {
      Accept: "application/octet-stream",
    },
  });
  return res.data;
};
