import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { ChatHome } from "./pages/chatHome/chatHome";
import { SocketLayout } from "./components/socketLayout/socketLayout";
import { VideoCall } from "./pages/videoCall/index";
import { VoiceCall } from "./pages/voiceCall/index";
import { PeerLayout } from "./components/peerLayout/peerLayout";

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<SocketLayout />}>
            <Route element={<PeerLayout />}>
              <Route path="/" element={<VerifyRoute children={<Home />} />} />
              <Route
                path="/chat/:id"
                element={<VerifyRoute children={<ChatHome />} />}
              />

              <Route
                path="/chat/video-call/:id"
                element={<VerifyRoute children={<VideoCall />} />}
              />
              <Route
                path="/chat/voice-call/:id"
                element={<VerifyRoute children={<VoiceCall />} />}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
