import { Outlet } from "react-router-dom";
import { SocketProvider } from "../context/socketProvider";

export const SocketLayout = () => {
    return (
      <SocketProvider>
        <Outlet />
      </SocketProvider>
    );
  };