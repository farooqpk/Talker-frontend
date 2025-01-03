import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth";
import { Home } from "./pages/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { SocketLayout } from "./components/socketLayout";
import PrivateChat from "./pages/privateChat";
import GroupChat from "./pages/groupChat";
import AiChat from "./pages/aiChat";
import { PeerLayout } from "./components/peerLayout";
import { CallLayout } from "./components/callLayout";
import { lazy } from "react";
const NotFound = lazy(() => import("./pages/404"));
const PrivacyPolicy = lazy(() => import("./pages/privacyPolicy"));

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route element={<VerifyRoute />}>
            <Route element={<SocketLayout />}>
              <Route element={<PeerLayout />}>
                <Route element={<CallLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/chat/ai" element={<AiChat />} />
                  <Route path="/chat/:id" element={<PrivateChat />} />
                  <Route path="/group/:id" element={<GroupChat />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
