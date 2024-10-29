import _axios from "@/lib/_axios";

export const chatWithAiApi = async (data: {
  message: string;
}): Promise<{ message: string }> => {
  return (await _axios.post("/api/ai/chat", data)).data;
};

type GetAiChatHistoryApiResponse = {
  content: string;
  role: "user" | "model";
}[]

export const getAiChatHistoryApi =
  async (): Promise<GetAiChatHistoryApiResponse> => {
    return (await _axios.get("/api/ai/get-history")).data;
  };
