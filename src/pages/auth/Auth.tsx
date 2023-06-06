import { motion } from "framer-motion";
import authPageImg from "../../assets/images/authImg.webp";
import { SiGoogle } from "react-icons/si";
import { useGoogleLogin } from "@react-oauth/google";
import { ReactElement, useState } from "react";
import { useGetMethod } from "../../hooks/apiCall/useGetMethod";
import ThemeToggle from "../../components/ui/themeToggle";

const Auth = (): ReactElement => {
  const [token, setToken] = useState<string>("");
  const {} = useGetMethod("sendAccessToken", "/login", {
    Authorization: `Bearer ${token}`,
  });

  const handleContinueWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse): void => {
      setToken(tokenResponse.access_token);
    },
    onError(errorResponse): void {
      console.log(errorResponse);
    },
  });

  return (
    <>
      <main className="absolute inset-0">
        {/* we can use absolue insert-0 to avoid viewport issue with h-screen in mobile devices */}
        <section className="flex flex-col items-center justify-center gap-10 h-full">
          <div className="p-2">
            <img src={authPageImg} className="animate-bounce" />
          </div>
          <div className="px-3 mx-2 flex flex-col gap-1 md:gap-4 text-center flex-wrap ">
            <h1 className="font-bold text-xl md:text-3xl">
              Enjoy the new experiance of chatting with global friends
            </h1>
            <span className=" text-sm md:text-2xl text-gray-400">
              Connect people around the world for free
            </span>
          </div>
          <div className="w-full flex justify-center">
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 1.1 }}
              className="w-[71%] md:w-[50%] lg:w-[30%] h-12 md:h-16 rounded-3xl md:rounded-full mb-16 flex justify-center items-center bg-primary appearance-none"
              onClick={() => handleContinueWithGoogle()}
            >
              <span className="mr-3">
                <SiGoogle size={27} className="text-white" />
              </span>
              <span className="text-lg md:text-2xl font-medium md:font-semibold text-white">
                Continue with Google
              </span>
            </motion.button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Auth;
