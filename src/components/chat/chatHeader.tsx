import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGetUser } from "@/hooks/useGetUser";
import { User, UserStatusEnum } from "../../types";
import { truncateUsername } from "@/lib/trunctuate";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "react-query";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";
import { getUsersForSearch } from "@/services/api/search";

export const ChatHeader = ({
  groupDetails,
  recipient,
  userStatus,
  isGroup,
  handleExitGroup,
}: {
  groupDetails?: any;
  recipient?: User;
  userStatus?: UserStatusEnum;
  isGroup: boolean;
  handleExitGroup?: () => void;
}) => {
  const { user } = useGetUser();
  const [isExitGroupModalOpen, setIsExitGroupModalOpen] = useState(false);
  const [users, setUsers] = useState<Option[]>([]);

  const { isLoading: isUsersLoading } = useQuery(
    ["usersToCreateGroup"],
    () => getUsersForSearch(),
    {
      onSuccess(data) {
        if (data) {
          const currentUsers = groupDetails?.Chat?.participants?.map(
            (participant: any) => participant?.user.userId
          );
          const updatedData = data?.filter(
            (item: any) => !currentUsers?.includes(item?.value)
          );
          setUsers(updatedData);
        }
      },
    }
  );

  return (
    <>
      {isGroup ? (
        <div className="flex items-center p-3 border-b rounded-xl">
          <Link to={`/`} className="absolute">
            <Button variant={"outline"} size={"icon"}>
              <ArrowLeft />
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger className="flex flex-col md:gap-2 mx-auto items-center cursor-pointer hover:bg-slate-900 px-3 py-1 rounded-md">
              <p className="text-lg truncate font-semibold">
                {groupDetails?.name}
              </p>
              <span className="text-xs text-muted-foreground">
                Tap here for group details
              </span>
            </SheetTrigger>
            <SheetContent side={"right"}>
              <SheetHeader>
                <SheetTitle>{groupDetails?.name}</SheetTitle>
                <SheetDescription>{groupDetails?.description}</SheetDescription>
              </SheetHeader>
              <div className="border my-3" />
              <div className="flex flex-col gap-3">
                {groupDetails?.adminId === user?.userId && (
                  <>
                    <div className="flex flex-col gap-1">
                      <MultipleSelector
                        creatable={false}
                        placeholder="Add members"
                        loadingIndicator={
                          isUsersLoading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )
                        }
                        options={users}
                        onChange={(formValue) => {
                          console.log(formValue);
                        }}
                        emptyIndicator={
                          users.length === 0 && <p>No users found</p>
                        }
                        className="w-full"
                      />
                      <Button
                        variant={"secondary"}
                        size={"sm"}
                        disabled={users.length === 0}
                        className="w-full md:w-auto"
                      >
                        {/* {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )} */}
                        Save
                      </Button>
                    </div>
                    <div className="border my-3" />
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <h1>Members</h1>
                  <p className="text-muted-foreground text-xs">
                    {groupDetails?.Chat?.participants?.length} members
                  </p>
                </div>

                <div className="max-h-[300px] overflow-y-auto flex flex-col gap-3">
                  {groupDetails?.Chat?.participants?.map((participant: any) => (
                    <div
                      key={participant?.user?.userId}
                      className="flex justify-between items-center hover:bg-slate-900 rounded-xl cursor-pointer p-2 "
                    >
                      <Link
                        to={
                          user?.userId === participant?.user?.userId
                            ? ""
                            : `/chat/${participant?.user?.userId}`
                        }
                        className="flex items-center gap-3 flex-1"
                      >
                        <Avatar>
                          <AvatarFallback className="capitalize">
                            {participant?.user?.username[0]}
                          </AvatarFallback>
                        </Avatar>

                        <p className="text-sm">{participant?.user?.username}</p>
                        {participant?.user?.userId ===
                          groupDetails?.adminId && (
                          <Badge className="text-xs" variant={"outline"}>
                            Admin
                          </Badge>
                        )}
                        {user?.userId === participant?.user?.userId && (
                          <Badge className="text-xs" variant={"outline"}>
                            You
                          </Badge>
                        )}
                      </Link>
                      {user?.userId === groupDetails?.adminId &&
                        participant?.user?.userId !== user?.userId && (
                          <Button
                            variant={"outline"}
                            className="rounded-full"
                            size={"icon"}
                          >
                            <Trash2 color="red" className="w-5 h-5" />
                          </Button>
                        )}
                    </div>
                  ))}
                </div>

                <div className="border my-3" />

                <Button
                  variant={"destructive"}
                  size={"sm"}
                  onClick={() => setIsExitGroupModalOpen(true)}
                  disabled={isExitGroupModalOpen}
                >
                  Exit Group
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex items-center p-3 rounded-xl border-b ">
          <Link to={`/`} className="absolute">
            <Button variant={"outline"} size={"icon"}>
              <ArrowLeft />
            </Button>
          </Link>
          <div className="flex flex-col md:gap-2 mx-auto">
            <p className="text-lg truncate font-semibold">
              {truncateUsername(recipient?.username!)}
            </p>
            {userStatus === UserStatusEnum.ONLINE ? (
              <span className="text-sm md:text-sm text-success">Online</span>
            ) : userStatus === UserStatusEnum.OFFLINE ? (
              <span className="text-sm md:text-sm text-error">Offline</span>
            ) : userStatus === UserStatusEnum.TYPING ? (
              <span className="text-sm md:text-sm text-warning">Typing...</span>
            ) : null}
          </div>
        </div>
      )}

      {isExitGroupModalOpen && (
        <AlertDialog open={isExitGroupModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure to exit?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsExitGroupModalOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => handleExitGroup?.()}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
