import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "react-query";
import { signup } from "@/services/api/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  createAsymmetricKeys,
  encryptPrivateKeyWithPassword,
  importPrivateKeyAsNonExtractable,
} from "@/lib/ecrypt_decrypt";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addValueToStoreIDB } from "@/lib/idb";
import { downloadDataAsFile } from "@/lib/downloadDataAsFile";

const Signup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showDownloadConfirmation, setShowDownloadConfirmation] =
    useState(false);
  const privateKeyRef = useRef<JsonWebKey | null>(null);

  const signupFormSchema = z.object({
    username: z
      .string()
      .min(3, "username must be at least 3 characters")
      .max(15, "username must be at most 15 characters"),
    password: z.string().min(6, "password must be at least 6 characters"),
  });

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
  });

  const {
    mutate: signupMutate,
    isLoading: signupLoading,
    error: signupError,
    isError: signupIsError,
  } = useMutation(signup);

  const handleSuccess = () => {
    toast({
      title: "Signup Success",
      description: "You have successfully signed up.",
      variant: "default",
    });
    navigate("/");
  };

  const handleSignup = async ({
    username,
    password,
  }: z.infer<typeof signupFormSchema>) => {
    const keys = await createAsymmetricKeys();
    privateKeyRef.current = keys.privateKey

    signupMutate(
      {
        username,
        password,
        publicKey: JSON.stringify(keys.publicKey),
      },
      {
        onSuccess: async (data) => {
          if (!data) return;

          const newPrivateKey = await importPrivateKeyAsNonExtractable(
            keys.privateKey
          );
          await addValueToStoreIDB(data?.user?.userId, newPrivateKey);
          localStorage.setItem("user", JSON.stringify(data?.user));
          setShowDownloadConfirmation(true);
        },
      }
    );
  };

  const handleDownloadPrivateKey = async () => {
    const encryptedPrivateKey = await encryptPrivateKeyWithPassword({
      privateKey: privateKeyRef.current as JsonWebKey,
      password: form.getValues("password"),
    });
    downloadDataAsFile(encryptedPrivateKey, "talker_private_key.enc");
    setShowDownloadConfirmation(false);
    handleSuccess();
  };


  const signupForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignup)}>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Talker</CardTitle>
            <CardDescription>Please sign up to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {signupIsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(
                    signupError as {
                      response?: { data?: { message?: string } };
                    }
                  )?.response?.data?.message || "An error occurred"}
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button disabled={signupLoading}>
              {signupLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );

  const downloadPrivateKeyConfirmation = () => (
    <main className="p-4 px-6 md:px-24">
      <AlertDialog
        open={showDownloadConfirmation}
        onOpenChange={setShowDownloadConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Download and Keep Your Private Key
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            If you do not download your private key, you will not be able to
            access your account from another device, browser, or after clearing
            your IndexedDB. Do you want to download the private key?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-red-600 hover:bg-red-800"
              onClick={handleSuccess}
            >
              Cancel Anyway
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDownloadPrivateKey}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );

  return (
    <>
      {
        showDownloadConfirmation
          ?
          downloadPrivateKeyConfirmation()
          : signupForm()

      }
    </>
  );
};

export default Signup;
