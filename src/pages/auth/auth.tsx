import { ReactElement } from "react";

const Auth = (): ReactElement => {
  return (
    <>
      {/* we can use absolue insert-0 to avoid viewport issue with h-screen in mobile devices */}
      <main className="absolute inset-0">
        <h1>hello world</h1>
      </main>
    </>
  );
};

export default Auth;
