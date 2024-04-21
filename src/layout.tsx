import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { PersonalChatHome } from "./pages/personalHome/personalChatHome";
import { SocketLayout } from "./components/socketLayout/socketLayout";
import { GroupChatHome } from "./pages/groupHome/groupChatHome";

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
              element={<VerifyRoute children={<PersonalChatHome />} />}
            />
            <Route
              path="/group/:id"
              element={<VerifyRoute children={<GroupChatHome />} />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
