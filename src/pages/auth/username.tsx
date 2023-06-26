import { useLocation, useNavigate } from "react-router-dom";
import { ReactElement, useEffect, useState } from "react";
import usernameImg from "../../assets/images/username1.webp";
import { useSignupPost } from "../../hooks/auth/useSignupPost";

export const Username = (): ReactElement => {
  const { state }: { state: string } = useLocation();
  const navigate = useNavigate();
  const [Inputvalue, setInputValue] = useState<string>("");
  const [inputValidationErr, setInputValidationErr] = useState<string>("");
  const { mutate, isLoading, error, isError, isSuccess, reset } =
    useSignupPost();

  useEffect(() => {
    if (!state) {
      navigate("/auth");
    }
  }, [state]);

  useEffect(() => {
    if (isSuccess === true) navigate("/home");
  }, [isSuccess]);

  const handleInput = (event: React.FormEvent<HTMLInputElement>): void => {
    setInputValidationErr("");
    setInputValue(event.currentTarget.value);
    if (isError) {
      // Clear the error state when input changes
      reset();
    }
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
    mutate({ access_subId: state, username: Inputvalue });
  };

  return (
    <>
      <main className="absolute inset-0">
        <section className="flex flex-col gap-6 items-center">
          <div>
            <img src={usernameImg} alt="loading.." draggable={"false"} />
          </div>

          <div>
            <h1 className="font-semibold text-lg md:text-2xl text-white">
              Create Your Unique Username
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 md:gap-4 w-[70%] md:w-[20%]"
          >
            <input
              type="text"
              placeholder="*username"
              onChange={handleInput}
              className="input border-secondary md:text-xl input-sm md:input-md text-secondary"
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
