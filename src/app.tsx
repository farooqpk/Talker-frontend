import Layout from "./layout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "react-query";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { MantineProvider } from "@mantine/core";

function App() {
  const client = new QueryClient();

  return (
    <>
      <Provider store={store}>
        {/* wrapping with redux store*/}
        <QueryClientProvider client={client}>
          {/* wrap with react query */}
          <GoogleOAuthProvider clientId={import.meta.env.VITE_AUTH_CLIENT_ID}>
            <MantineProvider withGlobalStyles withNormalizeCSS>
              <Layout /> {/* layout component(router)*/}
            </MantineProvider>
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </Provider>
    </>
  );
}

export default App;
