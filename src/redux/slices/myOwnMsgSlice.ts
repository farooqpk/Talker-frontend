import { createSlice } from "@reduxjs/toolkit";

export type MyOwnMsgStateType = {
  myMessage: string[];
};

const MyOwnMsgSlice = createSlice({
  initialState: { myMessage: [] } as MyOwnMsgStateType,
  name: "myMsgSlice",
  reducers: {
    setMyOwnMsg: (state, action) => {
      state.myMessage.push(action.payload);
    },
  },
});

export const { setMyOwnMsg } = MyOwnMsgSlice.actions;
export default MyOwnMsgSlice.reducer;
