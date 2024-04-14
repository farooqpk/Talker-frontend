import { Outlet } from "react-router-dom";
import { PeerProvider } from "../../context/peerProvider";

export const PeerLayout = () => {
  return (
    <PeerProvider>
      <Outlet />
    </PeerProvider>
  );
};
