import _axios from "@/lib/_axios";

export const chatWithAiApi = async (data: {
  message: string;
}): Promise<{ message: string }> => {
  return (await _axios.post("/api/ai/chat", data)).data
};
