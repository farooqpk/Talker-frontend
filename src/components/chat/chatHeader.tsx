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

export default function ChatHeader({
  groupDetails,
  recipient,
  userStatus,
  isGroup,
  handleExitGroup,
  handleUpdateGroupDetails,
  handleKickUserFromGroup
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
  handleKickUserFromGroup?: (userId: string) => void;
}) {
  const { user } = useGetUser();
  const [isExitGroupModalOpen, setIsExitGroupModalOpen] = useState(false);
  const [isGroupNameEdit, setIsGroupNameEdit] = useState(false);
  const [isGroupDiscEdit, setIsGroupDiscEdit] = useState(false);
  const [groupName, setGroupName] = useState<string>(groupDetails?.name);
  const [groupDescription, setGroupDescription] = useState<string>(
    groupDetails?.description
  );
  const [isAddNewMemberInputClicked, setIsAddNewMemberInputClicked] =
    useState(false);
  const [addNewMembers, setAddNewMembers] = useState<string[]>([]);
  const [users, setUsers] = useState([] as Option[]);

  useQuery<Option[]>({
    queryKey: ["addnewmemberstogroupu"],
    queryFn: () => getUsersForSearch({ isInfiniteScroll: false }),
    enabled: !!isAddNewMemberInputClicked,
    onSuccess: (data) => {
      if (!data) return;
      const existingMembers = groupDetails?.Chat?.participants?.map(
        (member: { user: User }) => member?.user?.userId
      );
      const filteredData: Option[] = data.filter(
        (item) => !existingMembers.includes(item.value)
      );
      setUsers(filteredData);
    },
  });

  return (
    <>
      {isGroup ? (
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
                {user?.userId === groupDetails?.adminId ? (
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
                {groupDetails?.adminId === user?.userId && (
                  <>
                    <div className="flex flex-col gap-1">
                      <MultiSelector
                        values={addNewMembers}
                        onValuesChange={(formValue) => {
                          let newArr = formValue?.map(
                            (option: string) => option
                          );
                          setAddNewMembers(newArr);
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
                          users.length === 0 || addNewMembers.length === 0
                        }
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
                          <IconButton
                            className="w-8 h-8 border-none"
                            icon={<Trash2 color="red" className="w-5 h-5" />}
                            onClick={() => handleKickUserFromGroup?.(participant?.user?.userId)}
                          />
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
}
