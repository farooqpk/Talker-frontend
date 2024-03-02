import Layout from "./layout";
import { QueryClient, QueryClientProvider } from "react-query";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { MantineProvider } from "@mantine/core";

function App() {
  const client = new QueryClient();

  return (
    <>
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <MantineProvider withGlobalStyles withNormalizeCSS>
            <Layout /> {/* layout component(router)*/}
          </MantineProvider>
        </QueryClientProvider>
      </Provider>
    </>
  );
}

export default App;
