import { Store, combineReducers, configureStore } from "@reduxjs/toolkit";
import ChatMsgSlice, { ChatMsgStateType } from "./slices/chatMsgSlice";

export type RootStateTypes = {
  ChatMsg: ChatMsgStateType;
};

const rootReducer = combineReducers<RootStateTypes>({
  ChatMsg: ChatMsgSlice,
});

export const store: Store = configureStore({
  reducer: rootReducer,
});
