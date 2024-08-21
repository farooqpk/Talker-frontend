import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ArrowLeft, CircleEllipsis, Pencil, Save } from "lucide-react";
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
import { GroupDetails, User, UserStatusEnum } from "../../types";
import { truncateUsername } from "@/lib/trunctuate";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multiple-selector";
import { getUsersForSearch } from "@/services/api/search";
import { Input } from "@/components/ui/input";
import { Option } from "../../types/index";
import { useQuery } from "react-query";
import { IconButton } from "../IconButton";
import { AlertDialogDescription } from "@radix-ui/react-alert-dialog";

type Props = {
  groupDetails?: GroupDetails;
  recipient?: User;
  userStatus?: UserStatusEnum;
  isGroup: boolean;
  handleExitGroup?: () => void;
  handleUpdateGroupDetails?: (data: {
    name?: string;
    description?: string;
  }) => void;
  handleKickUserFromGroup?: (userId: string) => void;
  handleAddNewMembers?: (selectedUsers: string[]) => void;
  isAddingNewMembersLoading?: boolean;
  handleSetAsAdmin?: (userId: string) => void;
  handleDeleteGroup?: () => void;
};

export default function ChatHeader({
  groupDetails,
  recipient,
  userStatus,
  isGroup,
  handleExitGroup,
  handleUpdateGroupDetails,
  handleKickUserFromGroup,
  handleAddNewMembers,
  isAddingNewMembersLoading,
  handleSetAsAdmin,
  handleDeleteGroup
}: Props) {
  const { user } = useGetUser();
  const [isExitGroupModalOpen, setIsExitGroupModalOpen] = useState(false);
  const [isGroupNameEdit, setIsGroupNameEdit] = useState(false);
  const [isGroupDiscEdit, setIsGroupDiscEdit] = useState(false);
  const [groupName, setGroupName] = useState<string>(groupDetails?.name || "");
  const [groupDescription, setGroupDescription] = useState<string>(
    groupDetails?.description || ""
  );
  const [isAddNewMemberInputClicked, setIsAddNewMemberInputClicked] =
    useState(false);
  const [users, setUsers] = useState([] as Option[]);
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const [isKickMemberClicked, setIsKickMemberClicked] = useState(false);
  const [kickMember, setKickMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isSetAsAdminClicked, setIsSetAsAdminClicked] = useState(false);
  const [newAdmin, setNewAdmin] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);

  useQuery<Option[]>({
    queryKey: ["addnewmemberstogroupu"],
    queryFn: () => getUsersForSearch({ isInfiniteScroll: false }),
    enabled: !!isAddNewMemberInputClicked,
    onSuccess: (data) => {
      if (!data) return;
      const existingMembers =
        groupDetails?.chat?.participants?.map(({ userId }) => userId) || [];
      const filteredData: Option[] = data.filter(
        (item) => !existingMembers.includes(item.value)
      );
      setUsers(filteredData);
    },
  });

  useEffect(() => {
    if (isAddingNewMembersLoading) {
      setNewMembers([]);
    }
  }, [isAddingNewMembersLoading]);

  return (
    <>
      {isGroup && groupDetails ? (
        <div className="flex items-center p-3 border-b rounded-xl">
          <Link to={`/`} className="absolute">
            <IconButton icon={<ArrowLeft />} className="w-8 h-8" />
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
                {groupDetails?.admins?.includes(user?.userId!) ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        value={groupName}
                        disabled={!isGroupNameEdit}
                        placeholder="Group Name"
                        onChange={(e) => setGroupName(e.target.value)}
                      />

                      <IconButton
                        disabled={groupName.trim()?.length < 3}
                        className="w-10 h-8 border-none"
                        onClick={() => {
                          setIsGroupNameEdit(!isGroupNameEdit);
                          if (isGroupNameEdit) {
                            handleUpdateGroupDetails?.({ name: groupName });
                          }
                        }}
                        icon={
                          isGroupNameEdit ? (
                            <Save size={17} />
                          ) : (
                            <Pencil size={17} />
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={groupDescription}
                        disabled={!isGroupDiscEdit}
                        placeholder="Group Description"
                        onChange={(e) => setGroupDescription(e.target.value)}
                      />

                      <IconButton
                        className="w-10 h-8 border-none"
                        disabled={groupDescription.trim()?.length < 1}
                        onClick={() => {
                          setIsGroupDiscEdit(!isGroupDiscEdit);
                          if (isGroupDiscEdit) {
                            handleUpdateGroupDetails?.({
                              description: groupDescription,
                            });
                          }
                        }}
                        icon={
                          isGroupDiscEdit ? (
                            <Save size={17} />
                          ) : (
                            <Pencil size={17} />
                          )
                        }
                      />
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
                {groupDetails?.admins?.includes(user?.userId!) && (
                  <>
                    <div className="flex flex-col gap-1">
                      <MultiSelector
                        values={newMembers || []}
                        onValuesChange={(formValue) => {
                          let newArr = formValue?.map(
                            (option: string) => option
                          );
                          setNewMembers(newArr);
                        }}
                        loop
                        className="w-full"
                      >
                        <MultiSelectorTrigger
                          onClick={() => setIsAddNewMemberInputClicked(true)}
                        >
                          <MultiSelectorInput
                            placeholder="Add members"
                            className="text-sm"
                          />
                        </MultiSelectorTrigger>
                        <MultiSelectorContent>
                          <MultiSelectorList className="max-h-[100px]">
                            {users?.map((item: Option) => {
                              return (
                                <MultiSelectorItem
                                  key={item.value}
                                  value={item.label}
                                >
                                  {item.label}
                                </MultiSelectorItem>
                              );
                            })}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>

                      <Button
                        variant={"secondary"}
                        size={"sm"}
                        disabled={
                          users.length === 0 ||
                          newMembers.length === 0 ||
                          isAddingNewMembersLoading
                        }
                        className="w-full md:w-auto"
                        onClick={() => {
                          const membersIds = newMembers.map(
                            (item) =>
                              users.find((user) => user.label === item)
                                ?.value as string
                          );
                          handleAddNewMembers?.(membersIds);
                        }}
                      >
                        {isAddingNewMembersLoading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    <div className="border my-3" />
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <h1>Members</h1>
                  <p className="text-muted-foreground text-xs">
                    {groupDetails?.chat?.participants?.length} members
                  </p>
                </div>

                <div className="max-h-[120px] overflow-y-auto flex flex-col gap-3 px-2">
                  {groupDetails?.chat?.participants?.map((participant) => (
                    <div
                      key={participant?.userId}
                      className="flex justify-between items-center hover:bg-slate-900 rounded-xl cursor-pointer p-2 "
                    >
                      <Link
                        to={
                          user?.userId === participant?.userId
                            ? ""
                            : `/chat/${participant?.userId}`
                        }
                        className="flex items-center gap-3 flex-1"
                      >
                        <Avatar>
                          <AvatarFallback className="capitalize">
                            {participant?.username[0]}
                          </AvatarFallback>
                        </Avatar>

                        <p className="text-sm">
                          {user?.userId === participant?.userId
                            ? "You"
                            : participant?.username}
                        </p>
                        {groupDetails?.admins?.includes(
                          participant?.userId!
                        ) && (
                          <Badge className="text-xs" variant={"outline"}>
                            Admin
                          </Badge>
                        )}
                      </Link>
                      {/* admin can't remove themselves and can't remove other admins */}
                      {groupDetails?.admins?.includes(user?.userId!) &&
                        !groupDetails?.admins?.includes(participant?.userId!) &&
                        participant?.userId !== user?.userId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <CircleEllipsis />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setNewAdmin({
                                    id: participant?.userId,
                                    name: participant?.username,
                                  });
                                  setIsSetAsAdminClicked(true);
                                }}
                              >
                                Set as Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setKickMember({
                                    id: participant?.userId,
                                    name: participant?.username,
                                  });
                                  setIsKickMemberClicked?.(true);
                                }}
                              >
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

                {groupDetails?.admins?.includes(user?.userId!) && (
                  <Button
                    variant={"destructive"}
                    size={"sm"}
                    onClick={() => setIsDeleteGroupModalOpen(true)}
                    disabled={isDeleteGroupModalOpen}
                  >
                    Delete Group
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex items-center p-3 rounded-xl border-b ">
          <Link to={`/`} className="absolute">
            <IconButton icon={<ArrowLeft />} className="w-8 h-8" />
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
            {groupDetails?.admins?.includes(user?.userId!) &&
              groupDetails?.admins?.length === 1 && (
                <AlertDialogDescription>
                  As you are the only admin of this group, you have to add a new
                  admin before you can exit the group.
                </AlertDialogDescription>
              )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsExitGroupModalOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/80"
                onClick={() => handleExitGroup?.()}
                disabled={
                  groupDetails?.admins?.includes(user?.userId!) &&
                  groupDetails?.admins?.length === 1
                }
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isKickMemberClicked && (
        <AlertDialog open={isKickMemberClicked}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {`Are you sure to remove ${kickMember?.name} from the group?`}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsKickMemberClicked?.(false);
                  setKickMember(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleKickUserFromGroup?.(kickMember?.id!);
                  setIsKickMemberClicked(false);
                  setKickMember(null);
                }}
                className="bg-destructive text-white hover:bg-destructive/80"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isSetAsAdminClicked && (
        <AlertDialog open={isSetAsAdminClicked}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {`Are you sure to set ${newAdmin?.name} as a admin?`}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsSetAsAdminClicked(false);
                  setNewAdmin(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleSetAsAdmin?.(newAdmin?.id!);
                  setIsSetAsAdminClicked(false);
                  setNewAdmin(null);
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isDeleteGroupModalOpen && (
        <AlertDialog open={isDeleteGroupModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure to delete this group?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setIsDeleteGroupModalOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/80"
                onClick={handleDeleteGroup}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
