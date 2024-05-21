import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";
import { createGroupApi, getPublicKeysApi } from "@/services/api/group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSymetricKey, encryptSymetricKey } from "@/lib/ecrypt_decrypt";
import { useMutation, useQueryClient } from "react-query";
import { useGetUser } from "@/hooks/useGetUser";
import { toast } from "../ui/use-toast";
import { getUsersForSearch } from "@/services/api/search";
import { useState } from "react";

const formSchema = z.object({
  groupName: z
    .string()
    .min(3, "group name must be at least 3 characters")
    .max(15, "group name must be at most 15 characters"),
  description: z.string(),
  members: z
    .array(z.string())
    .min(2, "at least three members including you is required")
    .max(9, "at most 10 members including you are allowed")
    .nonempty("members is required"),
});

const CreateGroup = ({
  isCreateGroupModalOpen,
  onClose,
}: {
  isCreateGroupModalOpen: boolean;
  onClose: () => void;
}) => {
  const { user } = useGetUser();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<Option[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { mutate, isLoading } = useMutation(createGroupApi);

  const handleCreateGroup = async (data: z.infer<typeof formSchema>) => {
    if (data.members.length < 2) {
      form.setError("members", {
        message: "at least three members including you is required",
      });
      return;
    }
    form.clearErrors();

    let encryptedChatKeyForUsers: Array<{
      userId: string;
      encryptedKey: string;
    }> = [];

    const [membersPublicKeys, chatKey] = await Promise.all([
      getPublicKeysApi([...data.members, user?.userId]),
      createSymetricKey(),
    ]);

    await Promise.all(
      membersPublicKeys.map(async (item) => {
        const encryptedChatKey = await encryptSymetricKey(
          chatKey,
          item.publicKey
        );

        encryptedChatKeyForUsers.push({
          userId: item.userId,
          encryptedKey: encryptedChatKey,
        });
      })
    );

    mutate(
      {
        groupName: data.groupName,
        description: data.description,
        encryptedChatKey: encryptedChatKeyForUsers,
      },
      {
        onSuccess(data) {
          if (data) {
            onClose();
            toast({
              title: "Group Created",
              description: "Group created successfully.",
              variant: "default",
            });
            queryClient.invalidateQueries({ queryKey: ["chatlist"] });
          }
        },
        onError() {
          toast({
            title: "Group Creation Failed",
            description: "Something went wrong",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Dialog open={isCreateGroupModalOpen} onOpenChange={onClose}>
        <DialogContent className="p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Create group</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateGroup)}>
              <div className="flex flex-col gap-4 mt-3 md:mt-6 ">
                <FormField
                  control={form.control}
                  name="groupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="members"
                  render={() => {
                    return (
                      <FormItem>
                        <FormLabel>Select members</FormLabel>
                        <FormControl>
                          <MultipleSelector
                            onSearch={async (val) => {
                              const options = await getUsersForSearch(
                                val || "",1
                              );
                              setUsers(options);
                              return options;
                            }}
                            triggerSearchOnFocus
                            options={users}
                            commandProps={{ inputMode: "none" }}
                            onChange={(formValue) => {
                              let newArr = formValue?.map(
                                (option) => option.value
                              );
                              form.setValue(
                                "members",
                                newArr as z.infer<typeof formSchema>["members"]
                              );
                            }}
                            emptyIndicator={
                              users?.length === 0 && <p>No users found</p>
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full md:w-auto"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGroup;
