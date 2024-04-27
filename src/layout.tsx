import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { PersonalChat } from "./pages/personalChat/personalChatHome";
import { SocketLayout } from "./components/socketLayout/socketLayout";
import { GroupChat } from "./pages/groupChat/groupChatHome";

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<SocketLayout />}>
            <Route path="/" element={<VerifyRoute children={<Home />} />} />
            <Route
              path="/chat/:id"
              element={<VerifyRoute children={<PersonalChat />} />}
            />
            <Route
              path="/group/:id"
              element={<VerifyRoute children={<GroupChat />} />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
