import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/ui/themeToggle";
import { ReactElement, useEffect, useState } from "react";
import usernameImg from "../../assets/images/username1.webp";
import { useLoginPost } from "../../hooks/auth/useLoginPost";

export const Username = (): ReactElement => {
  const { state }: { state: string } = useLocation();
  const navigate = useNavigate();
  const [Inputvalue, setInputValue] = useState<string>("");
  const [inputValidationErr, setInputValidationErr] = useState<string>("");
  const { mutate, isLoading, error, isError } = useLoginPost();

  useEffect(() => {
    if (!state) {
      navigate("/login");
    }
  }, [state]);

  const handleInput = (event: React.FormEvent<HTMLInputElement>): void => {
    setInputValidationErr("");
    setInputValue(event.currentTarget.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Perform username validation
    if (Inputvalue.trim() === "") {
      setInputValidationErr("Username is required");
      return;
    }

    // Check if the username contains only alphabetic characters
    if (!/^[a-zA-Z]+$/.test(Inputvalue)) {
      setInputValidationErr("Username should contain only letters");
      return;
    }
    mutate({ access_token: state, username: Inputvalue });
  };

  return (
    <>
      <main className="absolute inset-0">
        <section className="flex justify-end p-3 md:p-4 h-[5%]">
          <ThemeToggle />
        </section>
        <section className="flex h-[95%] flex-col gap-6 items-center">
          <div>
            <img src={usernameImg} alt="loading.." draggable={"false"} />
          </div>

          <div>
            <h1 className="font-semibold text-lg md:text-2xl">
              Create Your Unique Username
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 md:gap-4 md:w-[20%]"
          >
            <input
              type="text"
              placeholder="*username"
              onChange={handleInput}
              className="input input-secondary md:text-xl input-sm md:input-md"
            />
            {inputValidationErr && (
              <span className="text-error text-center">
                {inputValidationErr}
              </span>
            )}
            {isError && (
              <span className="text-error text-center">
                {(error as Error).message}
              </span>
            )}
            <button type="submit" className="btn btn-sm md:btn-md btn-primary">
              {isLoading && (
                <span className="loading loading-spinner loading-xs md:loading-md"></span>
              )}
              submit
            </button>
          </form>
        </section>
      </main>
    </>
  );
};
