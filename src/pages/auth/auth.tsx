import { ReactElement, useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { login, signup } from "@/services/api/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  createAsymmetricKeys,
  decryptPrivateKeyWithPassword,
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
import { addValueToStoreIDB, getValueFromStoreIDB } from "@/lib/idb";
import { User } from "@/types";
import { downloadDataAsFile, readDataFromFile } from "@/lib/utils";

const Auth = (): ReactElement => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showDownloadConfirmation, setShowDownloadConfirmation] =
    useState(false);
  const [privateKey, setPrivateKey] = useState<JsonWebKey | null>(null);
  const [isPrivateKeyNotExist, setIsPrivateKeyNotExist] = useState(false);
  const [hasLoginResponse, setHasLoginResponse] = useState(false);
  const [userData, setUserData] = useState({} as User & { password: string });

  const formSchema = z.object(
    isPrivateKeyNotExist && hasLoginResponse
      ? {
          privateKeyFile: z
            .instanceof(File, {
              message: "Please upload your private key file",
            })
            .refine((file) => file.name.endsWith(".enc"), {
              message: "Please upload your private key file",
            }),
        }
      : {
          username: z
            .string()
            .min(3, "username must be at least 3 characters")
            .max(15, "username must be at most 15 characters"),
          password: z.string().min(6, "password must be at least 6 characters"),
        }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const {
    mutate: loginMutate,
    isLoading: loginLoading,
    error: loginError,
    isError: loginIsError,
  } = useMutation(login);
  const {
    mutate: signupMutate,
    isLoading: signupLoading,
    error: signupError,
    isError: signupIsError,
  } = useMutation(signup);

  const handleAuthSuccess = (type: "login" | "signup") => {
    if (type === "signup") {
      toast({
        title: "Signup Success",
        description: "You have successfully signed up.",
        variant: "default",
      });
      navigate("/");
    } else if (type === "login") {
    }
  };

  const handleLogin = async ({
    username,
    password,
    privateKeyFile,
  }: z.infer<typeof formSchema>) => {
    if (isPrivateKeyNotExist) {
      // read the content of the file
      const encryptedPrivateKey = (await readDataFromFile(
        privateKeyFile,
        "arrayBuffer"
      )) as ArrayBuffer;

      const decryptedPrivateKey = await decryptPrivateKeyWithPassword({
        encryptedPrivateKey,
        password: userData.password,
      });

      if (!decryptedPrivateKey) {
        form.setError("privateKeyFile", {
          message: "Please provide a valid private key file",
        });
        return;
      }

      const privateKey = await importPrivateKeyAsNonExtractable(
        decryptedPrivateKey
      );

      await addValueToStoreIDB(userData.userId, privateKey);

      toast({
        title: "Login Success",
        description: "You have successfully logged in.",
        variant: "default",
      });
      localStorage.setItem(
        "user",
        JSON.stringify({ userId: userData.userId, username: userData.username })
      );
      navigate("/");

      return;
    }

    loginMutate(
      {
        username,
        password,
      },
      {
        onSuccess: async (data) => {
          if (data) {
            setHasLoginResponse(true);

            const isPrivateKeyExist = await getValueFromStoreIDB(
              data?.user?.userId
            );

            if (!isPrivateKeyExist) {
              setUserData({ password, ...data?.user });
              setIsPrivateKeyNotExist(true);
              form.reset();
              return;
            }

            toast({
              title: "Login Success",
              description: "You have successfully logged in.",
              variant: "default",
            });
            localStorage.setItem("user", JSON.stringify(data?.user));
            navigate("/");
          }
        },
      }
    );
  };

  const handleSignup = async ({
    username,
    password,
  }: z.infer<typeof formSchema>) => {
    const keys = await createAsymmetricKeys();
    setPrivateKey(keys.privateKey);

    signupMutate(
      {
        username,
        password,
        publicKey: JSON.stringify(keys.publicKey),
      },
      {
        onSuccess: async (data) => {
          if (data) {
            const newPrivateKey = await importPrivateKeyAsNonExtractable(
              keys.privateKey
            );
            await addValueToStoreIDB(data?.user?.userId, newPrivateKey);
            localStorage.setItem("user", JSON.stringify(data?.user));
            setShowDownloadConfirmation(true);
          }
        },
      }
    );
  };

  const handleDownloadPrivateKey = async () => {
    const encryptedPrivateKey = await encryptPrivateKeyWithPassword({
      privateKey: privateKey as JsonWebKey,
      password: form.getValues("password"),
    });
    downloadDataAsFile(encryptedPrivateKey, "talker_private_key.enc");
    setShowDownloadConfirmation(false);
    handleAuthSuccess("signup");
  };

  // to solve the chrome browser password check alert problem after signup
  useEffect(() => {
    if (showDownloadConfirmation) {
      // Ensure the dialog is focused when shown
      (
        document.querySelector('[role="dialog"]') as HTMLElement | null
      )?.focus();
    }
  }, [showDownloadConfirmation]);

  const authForm = () => (
    <main className="absolute inset-0 flex items-center justify-center px-6">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">LogIn</TabsTrigger>
          <TabsTrigger value="signup">SignUp</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)}>
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Talker</CardTitle>
                  <CardDescription>Please log in to continue.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loginIsError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {(
                          loginError as {
                            response?: { data?: { message?: string } };
                          }
                        )?.response?.data?.message || "An error occurred"}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isPrivateKeyNotExist ? (
                    <FormField
                      control={form.control}
                      name="privateKeyFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upload Private Key</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              onChange={(e) => {
                                field.onChange(e.target.files?.[0] || null);
                              }}
                              accept=".enc"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button disabled={loginLoading}>
                    {loginLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="signup">
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
        </TabsContent>
      </Tabs>
    </main>
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
              onClick={() => handleAuthSuccess("signup")}
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
      {showDownloadConfirmation ? downloadPrivateKeyConfirmation() : authForm()}
    </>
  );
};

export default Auth;
