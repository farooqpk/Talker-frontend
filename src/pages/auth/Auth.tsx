import { motion } from "framer-motion";
import authPageImg from "../../assets/images/authImg.webp";
import { SiGoogle } from "react-icons/si";

const Auth = () => {
  return (
    <>
      <main className="absolute inset-0">
        {/* we can use absolue insert-0 to avoid viewport issue with h-screen in mobile devices */}
        <section className="flex flex-col items-center justify-evenly h-full">
          <div className="p-2 mt-10">
            <img src={authPageImg} className="animate-bounce" />
          </div>
          <div className="px-3 mx-2 flex flex-col gap-1 md:gap-4 text-center md:mb-5">
            <h1 className="font-bold text-xl md:text-3xl font-sans ">
              Enjoy the new experiance of chatting with global friends
            </h1>
            <span className=" text-sm md:text-2xl text-gray-400 font-sans">
              Connect people around the world for free
            </span>
          </div>
          <div className="w-full flex justify-center mb-7 md:mb-28">
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 1.1 }}
              className="w-[71%] md:w-[30%] h-12 md:h-16 rounded-3xl md:rounded-full mb-16 flex justify-center items-center bg-primary appearance-none"
            >
              <span className="mr-3">
                <SiGoogle size={27} className="text-white" />
              </span>
              <span className="text-lg md:text-2xl font-medium md:font-semibold font-sans text-white">
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
