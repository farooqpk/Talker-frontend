import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useGetUser } from "@/hooks/user";
import { useMutation } from "react-query";
import { changeUsernameApi } from "@/services/api/auth";
import { Loader2 } from "lucide-react";

const FormSchema = z.object({
  username: z
    .string()
    .min(3, "username must be at least 3 characters")
    .max(15, "username must be at most 15 characters"),
});

const ChangeUsername = ({
  isChangeUsernameModalOpen,
  onClose,
}: {
  isChangeUsernameModalOpen: boolean;
  onClose: () => void;
}) => {
  const { user } = useGetUser();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: user?.username,
    },
  });

  const { mutate, isLoading } = useMutation(changeUsernameApi);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    mutate(data, {
      onSuccess: (res) => {
        if (!res) return;
        toast({
          title: "username has been updated successfully",
        });
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, username: data.username })
        );
        onClose();
      },
      onError: (error: any) => {
        form.setError("username", {
          message: error?.response?.data?.message || "Something went wrong",
        });
      },
    });
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Dialog open={isChangeUsernameModalOpen} onOpenChange={onClose}>
        <DialogContent className="p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Change username</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-2/3 space-y-6"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="username" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button disabled={isLoading} type="submit">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangeUsername;
