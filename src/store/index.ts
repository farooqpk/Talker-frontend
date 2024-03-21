import { create } from "zustand";

type ChatContentType = {
  chatContent: any[];
  setChatContent: (chatContent: any) => void;
};

export const useChatContent = create<ChatContentType>((set) => ({
  chatContent: [],
  setChatContent: (chatContent) =>
    set((state) => ({ chatContent: [...state.chatContent, chatContent] })),
}));


