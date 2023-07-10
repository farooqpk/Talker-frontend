import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Username } from "./pages/auth/username";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";
import { ChatHome } from "./pages/chatHome/chatHome";

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/username" element={<Username />} />
          <Route path="/home" element={<VerifyRoute children={<Home />} />} />
          <Route path="/chat" element={<ChatHome/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
