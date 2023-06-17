import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/login";
import { Username } from "./pages/auth/username";


const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/username" element={<Username />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
