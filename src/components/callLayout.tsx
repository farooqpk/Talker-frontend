import { Outlet } from "react-router-dom";
import { CallProvider } from "@/context/callProvider";

export const CallLayout = () => {
  return (
    <CallProvider>
      <Outlet />
    </CallProvider>
  );
};
