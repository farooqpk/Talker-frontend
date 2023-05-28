import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/Auth";

const Layout = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
