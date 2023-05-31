import Layout from "./Layout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "react-query";

function App() {
  const client = new QueryClient();

  return (
    <>
      <QueryClientProvider client={client}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_AUTH_CLIENT_ID}>
          <Layout />
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
