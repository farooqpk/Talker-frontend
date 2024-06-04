import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { SocketLayout } from "./components/socketLayout/socketLayout";
import { lazy } from "react";
const PrivateChat = lazy(() => import("./pages/privateChat/privateChatHome"));
const GroupChat = lazy(() => import("./pages/groupChat/groupChatHome"));

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<VerifyRoute />}>
            <Route element={<SocketLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/chat/:id" element={<PrivateChat />} />
              <Route path="/group/:id" element={<GroupChat />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
