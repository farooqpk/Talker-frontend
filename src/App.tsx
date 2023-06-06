import Layout from "./Layout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  MantineProvider,
  ColorSchemeProvider,
  ColorScheme,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { store } from "./redux/store";
import { Provider } from "react-redux";

function App() {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
  };

  const client = new QueryClient();

  return (
    <>
      <Provider store={store}>
        {/* wrapping with redux store*/}
        <QueryClientProvider client={client}>
          {/* wrap with react query */}
          <GoogleOAuthProvider clientId={import.meta.env.VITE_AUTH_CLIENT_ID}>
            <ColorSchemeProvider
              colorScheme={colorScheme}
              toggleColorScheme={toggleColorScheme}
            >
              <MantineProvider //mantine ui library
                withGlobalStyles
                withNormalizeCSS
                theme={{
                  colorScheme: colorScheme,
                }}
              >
                <Layout /> {/* layout component(router)*/}
              </MantineProvider>
            </ColorSchemeProvider>
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </Provider>
    </>
  );
}

export default App;
