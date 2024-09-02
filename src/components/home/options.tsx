import { Loader2, Plus, Sparkle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useMutation, useQuery } from "react-query";
import { logoutApi } from "@/services/api/auth";
import { useToast } from "../ui/use-toast";
import { AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import { deleteAccountApi, isAnyGroupAdminApi } from "@/services/api/user";
import { useGetUser } from "@/hooks/useGetUser";
import { IconButton } from "../IconButton";

const Options = () => {
  const navigate = useNavigate();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isChangeUsernameModalOpen, setIsChangeUsernameModalOpen] =
    useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const { toast } = useToast();
  const { user } = useGetUser();

  const { mutate: logoutMutate, isLoading: logoutIsLoading } =
    useMutation(logoutApi);
  const { mutate: deleteAccountMutate, isLoading: deleteAcccountLoading } =
    useMutation(deleteAccountApi);

  const handleLogout = () => {
    logoutMutate(
      {},
      {
        onSuccess: () => {
          toast({
            title: "Logout Successful",
            description: "You have been logged out successfully",
          });
          navigate("/auth");
        },
      }
    );
  };

  const { data: groupAdmin } = useQuery({
    queryKey: ["isAnyGroupAdmin", isDeleteAccountModalOpen, user?.userId],
    queryFn: () => isAnyGroupAdminApi(user?.userId!),
    enabled: isDeleteAccountModalOpen,
  });

  function getDeleteAccountDescription() {
    const {
      isAnyGroupAdmin,
      doAllGroupsHaveRemainingAdmins,
      groupsHaveNoRemainingAdmins,
    } = groupAdmin || {};

    if (isAnyGroupAdmin && !doAllGroupsHaveRemainingAdmins) {
      return `You are the only admin of the groups '${groupsHaveNoRemainingAdmins}'. You have to make another admin of the groups before you can delete your account.`;
    } else {
      return `If you delete your account, you will not be able to access your account again. This action cannot be undone and you will lose all your data.`;
    }
  }

  const handleDeleteAccount = () => {
    deleteAccountMutate(
      {},
      {
        onSuccess: () => {
          toast({
            title: "Account Deleted",
            description: "Your account has been deleted successfully",
          });
          navigate("/auth");
        },
      }
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 ">
      <div className="fixed bottom-7 right-5 md:bottom-10 md:right-6">
        <div className="flex flex-col gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <IconButton
                  className="rounded-full h-12 w-12 bg-secondary hover:bg-secondary/70"
                  icon={<Sparkle className="h-5 w-5" strokeWidth={3} />}
                  onClick={() => navigate("/chat/ai")}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Talker AI</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <IconButton
                      className="rounded-full h-12 w-12 bg-secondary hover:bg-secondary/70"
                      icon={<Plus className="h-5 w-5" strokeWidth={3} />}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="mr-3">
                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid gap-2">
                      <DropdownMenuItem
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setIsCreateGroupModalOpen(true)}
                      >
                        Create group
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setIsChangeUsernameModalOpen(true)}
                      >
                        Change username
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setIsLogoutModalOpen(true)}
                      >
                        Logout
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setIsDeleteAccountModalOpen(true)}
                      >
                        Delete account
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
                {logoutIsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Logout"
                )}
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

      {isDeleteAccountModalOpen && (
        <AlertDialog open={isDeleteAccountModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure to delete account?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              {getDeleteAccountDescription()}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setIsDeleteAccountModalOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-800 text-white"
                disabled={
                  (groupAdmin?.isAnyGroupAdmin &&
                    !groupAdmin?.doAllGroupsHaveRemainingAdmins) ||
                  deleteAcccountLoading
                }
              >
                {deleteAcccountLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Options;
