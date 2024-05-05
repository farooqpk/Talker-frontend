import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CreateGroup from "../group/createGroup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ChangeUsername from "../common/ChangeUsername";

const Options = () => {
  const navigate = useNavigate();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isChangeUsernameModalOpen, setIsChangeUsernameModalOpen] =
    useState(false);

  const handleLogout = () => {
    Cookies.remove("accesstoken");
    Cookies.remove("refreshtoken");
    navigate("/auth");
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant={"outline"} className="rounded-full p-2 ">
              <Plus className="h-5 md:h-7" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-3">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Export keys</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsCreateGroupModalOpen(true)}>
              Create group
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsChangeUsernameModalOpen(true)}
            >
              Change username
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isCreateGroupModalOpen && (
        <CreateGroup
          onClose={() => setIsCreateGroupModalOpen(false)}
          isCreateGroupModalOpen={isCreateGroupModalOpen}
        />
      )}
      {isLogoutModalOpen && (
        <AlertDialog open={isLogoutModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure to logout?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsLogoutModalOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {isChangeUsernameModalOpen && (
        <ChangeUsername
          onClose={() => setIsChangeUsernameModalOpen(false)}
          isChangeUsernameModalOpen={isChangeUsernameModalOpen}
        />
      )}
    </div>
  );
};

export default Options;
