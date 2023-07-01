import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Username } from "./pages/auth/username";
import { Home } from "./pages/home/home";
import { VerifyRoute } from "./components/auth/verifyRoute";

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/username" element={<Username />} />
          <Route path="/home" element={<VerifyRoute children={<Home />} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
