import { ReactElement } from "react";
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

const formSchema = z.object({
  username: z
    .string()
    .min(3, "username must be at least 3 characters")
    .max(15, "username must be at most 15 characters"),
  password: z.string().min(6, "password must be at least 6 characters"),
});

const Auth = (): ReactElement => {
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleLogin = ({ username, password }: z.infer<typeof formSchema>) => {
    loginMutate(
      {
        username,
        password,
      },
      {
        onSuccess: (data) => {
          if (data) {
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

  const handleSignup = ({ username, password }: z.infer<typeof formSchema>) => {
    signupMutate(
      {
        username,
        password,
      },
      {
        onSuccess: (data) => {
          if (data) {
            toast({
              title: "Signup Success",
              description: "You have successfully signed up.",
              variant: "default",
            });
            localStorage.setItem("user", JSON.stringify(data?.user));
            navigate("/");
          }
        },
      }
    );
  };

  return (
    <>
      {/* we can use absolue insert-0 to avoid viewport issue with h-screen in mobile devices */}
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
                    <CardDescription>
                      Please log in to continue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                    <CardDescription>
                      Please sign up to continue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
    </>
  );
};

export default Auth;
