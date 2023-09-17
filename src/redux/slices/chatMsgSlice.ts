import { createSlice } from "@reduxjs/toolkit";

export type ChatMsgStateType = {
  sender: string;
  message: string[];
};

const ChatMsgSlice = createSlice({
  initialState: { sender: "", message: [] } as ChatMsgStateType,
  name: "messageSlice",
  reducers: {
    setMessage: (state, action) => {
      const { sender, message } = action.payload;
      state.message.push(message);
      state.sender = sender;
    },
  },
});

export const { setMessage } = ChatMsgSlice.actions;
export default ChatMsgSlice.reducer;
