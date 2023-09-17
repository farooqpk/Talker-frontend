import { Store, combineReducers, configureStore } from "@reduxjs/toolkit";
import ChatMsgSlice, { ChatMsgStateType } from "./slices/chatMsgSlice";
import MyOwnMsgSlice, { MyOwnMsgStateType } from "./slices/myOwnMsgSlice";

export type RootStateTypes = {
  ChatMsg: ChatMsgStateType;
  MyOwnMsg: MyOwnMsgStateType;
};

const rootReducer = combineReducers<RootStateTypes>({
  ChatMsg: ChatMsgSlice,
  MyOwnMsg: MyOwnMsgSlice,
});

export const store: Store = configureStore({
  reducer: rootReducer,
});
