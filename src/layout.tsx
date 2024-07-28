import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { SocketLayout } from "./components/socketLayout/socketLayout";
import PrivateChat from "./pages/privateChat/privateChatHome";
import GroupChat from "./pages/groupChat/groupChatHome";
import { PrivacyPolicy } from "./pages/privacy-policy/privacy-policy";

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
