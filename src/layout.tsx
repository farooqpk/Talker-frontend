import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { ChatHome } from "./pages/chatHome/chatHome";
import { SocketLayout } from "./components/socketLayout/socketLayout";

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
              element={<VerifyRoute children={<ChatHome />} />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
