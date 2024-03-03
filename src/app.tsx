import Layout from "./layout";
import { QueryClient, QueryClientProvider } from "react-query";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const client = new QueryClient();

  return (
    <>
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Toaster />
            <Layout />
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </>
  );
}

export default App;
