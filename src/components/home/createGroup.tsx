import { Loader2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";
import { useEffect, useState } from "react";
import {
  createGroupApi,
  findUsersToCreateGroupApi,
  getPublicKeysApi,
} from "@/services/api/group";
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
import { useMutation } from "react-query";
import { useGetUser } from "@/hooks/user";
import { toast } from "../ui/use-toast";

const formSchema = z.object({
  groupName: z.string(),
  description: z.string(),
  members: z.array(z.string()),
});

const CreateGroup = () => {
  const [users, setUsers] = useState<Option[]>([]);
  const { user } = useGetUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    findUsersToCreateGroupApi().then((res: Option[]) => {
      setUsers(res);
    });
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { mutate, isLoading } = useMutation(createGroupApi);

  const handleCreateGroup = async (data: z.infer<typeof formSchema>) => {
    let encryptedGroupKeyForMembers: Array<{
      userId: string;
      encryptedGroupKey: string;
    }> = [];

    const [membersPublicKeys, groupSymetricKey] = await Promise.all([
      getPublicKeysApi([...data.members, user?.userId]),
      createSymetricKey(),
    ]);

    await Promise.all(
      membersPublicKeys.map(async (item) => {
        const encryptedGroupKey = await encryptSymetricKey(
          groupSymetricKey,
          item.publicKey
        );

        encryptedGroupKeyForMembers.push({
          userId: item.userId,
          encryptedGroupKey,
        });
      })
    );

    mutate(
      {
        groupName: data.groupName,
        description: data.description,
        membersWithEncryptedGroupKey: encryptedGroupKeyForMembers,
      },
      {
        onSuccess(data) {
          if (data) {
            setIsModalOpen(false);
            toast({
              title: "Group Created",
              description: "Group created successfully.",
              variant: "default",
            });
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
    <Dialog open={isModalOpen} onOpenChange={(state) => setIsModalOpen(state)}>
      <DialogTrigger asChild>
        <div className="absolute bottom-10">
          <Button
            variant={"outline"}
            className="rounded-full p-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-7 w-7" />
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateGroup)}>
            <div className="flex flex-col gap-4 mt-3">
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
                render={() => (
                  <FormItem>
                    <FormLabel>Select members</FormLabel>
                    <FormControl>
                      <MultipleSelector
                        defaultOptions={users}
                        onChange={(formValue) => {
                          let newArr = formValue?.map((option) => option.value);
                          form.setValue(
                            "members",
                            newArr as z.infer<typeof formSchema>["members"]
                          );
                        }}
                        emptyIndicator={
                          <p className="text-center text-sm leading-10 text-gray-600 dark:text-gray-400">
                            no results found.
                          </p>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroup;
