import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowLeft, Pencil, Save, Trash2 } from "lucide-react";
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
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";
import { getUsersForSearch } from "@/services/api/search";
import { Input } from "@/components/ui/input";

export const ChatHeader = ({
  groupDetails,
  recipient,
  userStatus,
  isGroup,
  handleExitGroup,
  handleUpdateGroupDetails,
}: {
  groupDetails?: any;
  recipient?: User;
  userStatus?: UserStatusEnum;
  isGroup: boolean;
  handleExitGroup?: () => void;
  handleUpdateGroupDetails?: (data: {
    name?: string;
    description?: string;
  }) => void;
}) => {
  const { user } = useGetUser();
  const [isExitGroupModalOpen, setIsExitGroupModalOpen] = useState(false);
  const [users, setUsers] = useState<Option[]>([]);
  const [isGroupNameEdit, setIsGroupNameEdit] = useState(false);
  const [isGroupDiscEdit, setIsGroupDiscEdit] = useState(false);
  const [groupName, setGroupName] = useState<string>(groupDetails?.name);
  const [groupDescription, setGroupDescription] = useState<string>(
    groupDetails?.description
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

          <Sheet
            onOpenChange={() => {
              setIsGroupNameEdit(false);
              setIsGroupDiscEdit(false);
              setGroupName(groupDetails?.name);
              setGroupDescription(groupDetails?.description);
            }}
          >
            <SheetTrigger className="flex flex-col md:gap-2 mx-auto items-center cursor-pointer hover:bg-slate-900 px-3 py-1 rounded-md">
              <p className="text-lg truncate font-semibold">
                {groupDetails?.name}
              </p>
              <span className="text-xs text-muted-foreground">
                Tap here for group details
              </span>
            </SheetTrigger>
            <SheetContent side={"right"} className="max-h-full overflow-y-auto">
              <SheetHeader className="pt-5">
                {user?.userId === groupDetails?.adminId ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        value={groupName}
                        disabled={!isGroupNameEdit}
                        placeholder="Group Name"
                        onChange={(e) => setGroupName(e.target.value)}
                      />

                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        disabled={groupName.trim()?.length < 3}
                        onClick={() => {
                          setIsGroupNameEdit(!isGroupNameEdit);
                          if (isGroupNameEdit ) {
                            handleUpdateGroupDetails?.({ name: groupName });
                          }
                        }}
                      >
                        {isGroupNameEdit ? (
                          <Save size={17} />
                        ) : (
                          <Pencil size={17} />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={groupDescription}
                        disabled={!isGroupDiscEdit}
                        placeholder="Group Description"
                        onChange={(e) =>
                          setGroupDescription(e.target.value)
                        }
                      />

                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        disabled={groupDescription.trim()?.length < 1}
                        onClick={() => {
                          setIsGroupDiscEdit(!isGroupDiscEdit);
                          if (isGroupDiscEdit) {
                            handleUpdateGroupDetails?.({
                              description: groupDescription,
                            });
                          }
                        }}
                      >
                        {isGroupDiscEdit ? (
                          <Save size={17} />
                        ) : (
                          <Pencil size={17} />
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <SheetTitle>{groupDetails?.name}</SheetTitle>
                    <SheetDescription>
                      {groupDetails?.description}
                    </SheetDescription>
                  </>
                )}
              </SheetHeader>

              <div className="border my-5" />
              <div className="flex flex-col gap-3">
                {groupDetails?.adminId === user?.userId && (
                  <>
                    <div className="flex flex-col gap-1">
                      <MultipleSelector
                        placeholder="Add members"
                        options={users}
                        onSearch={async (val) => {
                          const options = await getUsersForSearch(val || "",1);
                          const currentUsers =
                            groupDetails?.Chat?.participants?.map(
                              (participant: any) => participant?.user.userId
                            );
                          const updatedData = options?.filter(
                            (item: any) => !currentUsers?.includes(item?.value)
                          );
                          setUsers(updatedData);
                          return updatedData;
                        }}
                        triggerSearchOnFocus
                        onChange={(formValue) => {
                          console.log(formValue);
                        }}
                        emptyIndicator={
                          users.length === 0 && <p>No users found</p>
                        }
                        className="w-full max-h-[100px] overflow-y-auto"
                        commandProps={{ inputMode: "none" }}
                      />
                      <Button
                        variant={"secondary"}
                        size={"sm"}
                        disabled={users.length === 0}
                        className="w-full md:w-auto"
                      >
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

                <div className="max-h-[120px] overflow-y-auto flex flex-col gap-3 px-2">
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

                        <p className="text-sm">
                          {user?.userId === participant?.user?.userId
                            ? "You"
                            : participant?.user?.username}
                        </p>
                        {participant?.user?.userId ===
                          groupDetails?.adminId && (
                          <Badge className="text-xs" variant={"outline"}>
                            Admin
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
