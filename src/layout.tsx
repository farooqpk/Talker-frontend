import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/auth";
import { Username } from "./pages/auth/username";


const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/username" element={<Username />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
