import { Outlet } from "react-router-dom";
import { SocketProvider } from "../../socket/socketProvider";

export const SocketLayout = () => {
    return (
      <SocketProvider>
        <Outlet />
      </SocketProvider>
    );
  };