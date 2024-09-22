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
import { Link, useNavigate } from "react-router-dom";
import {
  createAsymmetricKeys,
  encryptPrivateKeyWithPassword,
  importPrivateKeyAsNonExtractable,
} from "@/lib/ecrypt_decrypt";
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

  type SignupFormSchema = z.infer<typeof signupFormSchema>;

  const handleSignup = async ({ username, password }: SignupFormSchema) => {
    const keys = await createAsymmetricKeys();
    privateKeyRef.current = keys.privateKey;

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
          toast({
            title: "Signup Success",
            description: "You have successfully signed up.",
            variant: "default",
          });
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
    navigate("/");
  };

  return (
    <div className="relative">
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
            <CardFooter className="flex flex-col items-start gap-3">
              <Button disabled={signupLoading} className="w-full">
                {signupLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>

              <div className="text-sm text-gray-500">
                By signing up, you agree to our{" "}
                <Link
                  to="/privacy-policy"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {showDownloadConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full border">
            <h2 className="text-lg font-bold mb-4">
              Download and Keep Your Private Key
            </h2>
            <p className="mb-6 text-sm">
              If you do not download your private key, you will not be able to
              access your account from another device, browser, or after
              clearing your IndexedDB. Do you want to download the private key?
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDownloadConfirmation(false);
                  navigate("/");
                }}
              >
                Cancel Anyway
              </Button>
              <Button onClick={handleDownloadPrivateKey}>Download</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
