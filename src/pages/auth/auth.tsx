import { motion } from "framer-motion";
import authPageImg from "../../assets/images/authImg.webp";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { ReactElement, useEffect } from "react";
import { useIsUserAlreadyExist } from "../../hooks/auth/useIsUserAlreadyExist";
import { useNavigate } from "react-router-dom";
import { ThreeDots } from "react-loader-spinner";

const Auth = (): ReactElement => {
  const navigate = useNavigate();
  const { mutate, data, isLoading } = useIsUserAlreadyExist();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      return mutate(tokenResponse.access_token);
    },
    onError(errorResponse): void {
      console.log(errorResponse);
    },
  });

  useEffect(() => {
    if (data?.data.isExist === true) {
      console.log("user already exist");
      navigate("/home");
    } else if (data?.data.isExist === false) {
      console.log("user not exist");
      navigate("/username", { state: data.data.subId });
    }
  }, [data?.data]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ThreeDots
            height="100"
            width="100"
            radius="9"
            color="#7541f1"
            ariaLabel="three-dots-loading"
            wrapperStyle={{}}
            visible={true}
          />
        </div>
      )}

      <main className="absolute inset-0">
        {/* we can use absolue insert-0 to avoid viewport issue with h-screen in mobile devices */}
        <section className="flex flex-col items-center justify-center gap-10 h-full">
          <div className="p-2">
            <img
              src={authPageImg}
              draggable={"false"}
              className="animate-bounce"
            />
          </div>
          <div className="px-3 mx-2 flex flex-col gap-4 md:gap-4 text-center flex-wrap ">
            <h1 className="font-bold text-xl md:text-3xl text-white">
              Enjoy The New Experiance Of Chatting With Global Friends
            </h1>
            <span className=" text-sm md:text-2xl text-secondary">
              Connect people around the world for free
            </span>
          </div>
          <div className="w-full flex justify-center flex-col items-center gap-0">
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 1.1 }}
              className="w-[71%] md:w-[50%] lg:w-[30%] h-12 md:h-16 rounded-3xl md:rounded-full mb-16 flex justify-center items-center bg-primary appearance-none"
              onClick={() => handleGoogleLogin()}
            >
              <span className="mr-2 md:mr-4">
                <FcGoogle className="text-3xl md:text-4xl" />
              </span>
              <span className="text-lg md:text-2xl font-medium md:font-semibold text-white">
                Continue with Google
              </span>
            </motion.button>
            <p className="text-xs md:text-sm font-sans text-secondary">Powered by talker</p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Auth;
