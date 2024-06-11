import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multiple-selector";
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
import { createSymetricKey, encryptSymetricKeyWithPublicKey } from "@/lib/ecrypt_decrypt";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useGetUser } from "@/hooks/useGetUser";
import { toast } from "../ui/use-toast";
import { getUsersForSearch } from "@/services/api/search";
import { Option } from "../../types/index";

const formSchema = z.object({
  groupName: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(15, "Group name must be at most 15 characters"),
  description: z.string(),
  members: z
    .array(z.string())
    .min(2, "At least three members including you are required")
    .max(9, "At most 10 members including you are allowed")
    .nonempty("Members are required"),
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

  const { data: users } = useQuery<Option[]>({
    queryKey: ["creategroupusers"],
    queryFn: () => getUsersForSearch({ isInfiniteScroll: false }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { mutate, isLoading } = useMutation(createGroupApi);

  const handleCreateGroup = async (data: z.infer<typeof formSchema>) => {
    const members = data.members.map(
      (item) => users?.find?.((user) => user.label === item)?.value as string
    );

    if (members.length < 2) {
      form.setError("members", {
        message: "At least three members including you are required",
      });
      return;
    }
    form.clearErrors();

    let encryptedChatKeyForUsers: Array<{
      userId: string;
      encryptedKey: ArrayBuffer;
    }> = [];

    const [membersPublicKeys, chatKey] = await Promise.all([
      getPublicKeysApi([...members, user?.userId]),
      createSymetricKey(),
    ]);

    await Promise.all(
      membersPublicKeys.map(async (item) => {
        const encryptedChatKey = await encryptSymetricKeyWithPublicKey(
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
                          <MultiSelector
                            values={form.watch("members") || []}
                            onValuesChange={(formValue) => {
                              let newArr = formValue?.map(
                                (option: string) => option
                              );
                              form.setValue(
                                "members",
                                newArr as z.infer<typeof formSchema>["members"]
                              );
                            }}
                            loop
                            className="w-full"
                          >
                            <MultiSelectorTrigger>
                              <MultiSelectorInput />
                            </MultiSelectorTrigger>
                            <MultiSelectorContent>
                              <MultiSelectorList className="max-h-[130px]">
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
