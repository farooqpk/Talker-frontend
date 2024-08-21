import { useRef, useState } from "react";
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
import { login, loginTokenApi } from "@/services/api/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  createSymetricKey,
  decryptPrivateKeyWithPassword,
  decryptSymetricKeyWithPrivateKey,
  encryptSymetricKeyWithPublicKey,
  importPrivateKeyAsNonExtractable,
} from "@/lib/ecrypt_decrypt";
import { addValueToStoreIDB, getValueFromStoreIDB } from "@/lib/idb";
import { User } from "@/types";
import { readDataFromFile } from "@/lib/readDataFromFile";

interface LoginError {
  response: {
    data: {
      message: string;
    };
  };
}

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isPrivateKeyNotExist, setIsPrivateKeyNotExist] = useState(false);
  const userDataRef = useRef({} as User & { password: string });
  const loginTokenRef = useRef("");

  const loginFormSchema = z.object(
    isPrivateKeyNotExist
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

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
  });

  const {
    mutate: loginMutate,
    isLoading: loginLoading,
    error: loginError,
    isError: loginIsError,
  } = useMutation(login);

  const {
    mutate: loginTokenMutate,
    isLoading: loginTokenLoading,
    isError: loginTokenIsError,
    error: loginTokenError,
  } = useMutation(loginTokenApi);

  const handleSuccess = () => {
    toast({
      title: "Login Success",
      description: "You have successfully logged in.",
      variant: "default",
    });
    navigate("/");
  };

  const handleLoginToken = () => {
    loginTokenMutate(
      {
        userId: userDataRef.current?.userId,
        loginToken: loginTokenRef.current,
      },
      {
        onSuccess: handleSuccess,
      }
    );
  };

  const handleIsPrivateKeyNotExist = async (privateKeyFile: File) => {
    const encryptedPrivateKey = (await readDataFromFile(
      privateKeyFile,
      "arrayBuffer"
    )) as ArrayBuffer;

    const decryptedPrivateKey = await decryptPrivateKeyWithPassword({
      encryptedPrivateKey,
      password: userDataRef.current?.password,
    });

    if (!decryptedPrivateKey) {
      form.setError("privateKeyFile", {
        message: "Invalid private key file. Please try again.",
      });
      return;
    }

    const privateKey = await importPrivateKeyAsNonExtractable(
      decryptedPrivateKey
    );

    // encrypt and decrypt the sample symmetric key to test its valid or not
    try {
      const sampleSymetricKey = await createSymetricKey();
      const encryptedSampleSymetricKey = await encryptSymetricKeyWithPublicKey(
        sampleSymetricKey,
        userDataRef.current?.publicKey
      );
      await decryptSymetricKeyWithPrivateKey(
        encryptedSampleSymetricKey,
        privateKey
      );
    } catch (error) {
      form.setError("privateKeyFile", {
        message: "Invalid private key file. Please try again.",
      });
      return;
    }

    await addValueToStoreIDB(userDataRef.current?.userId, privateKey);

    localStorage.setItem(
      "user",
      JSON.stringify({
        userId: userDataRef.current?.userId,
        username: userDataRef.current?.username,
        publicKey: userDataRef.current?.publicKey,
      })
    );

    handleLoginToken();
  };

  const handleLogin = async ({
    username,
    password,
    privateKeyFile,
  }: z.infer<typeof loginFormSchema>) => {
    // after upload the private key file
    if (isPrivateKeyNotExist) {
      handleIsPrivateKeyNotExist(privateKeyFile);
      return;
    }

    loginMutate(
      {
        username,
        password,
      },
      {
        onSuccess: async (data) => {
          if (!data) return;

          // set the user data
          userDataRef.current = { password, ...data?.user };

          // we have to keep the token
          loginTokenRef.current = data.loginToken;

          // first we have to check wether the private key exist or not
          const isPrivateKeyExist = await getValueFromStoreIDB(
            data?.user?.userId
          );
          // if not exit then we update the state and show the file input then return from here,
          if (!isPrivateKeyExist) {
            setIsPrivateKeyNotExist(true);
            form.reset();
            return;
          }
          // if private key already exist then immediately make the api call to loginTokenApi
          handleLoginToken();
        },
      }
    );
  };

  return (
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
                  {(loginError as LoginError)?.response?.data?.message}
                </AlertDescription>
              </Alert>
            )}
            {loginTokenIsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(loginTokenError as LoginError)?.response?.data?.message}
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
            <Button
              disabled={loginLoading || loginTokenLoading}
              className="w-full"
            >
              {loginLoading ||
                (loginTokenLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ))}
              Submit
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default Login;
