import Layout from "./layout";
import { QueryClient, QueryClientProvider } from "react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const client = new QueryClient();

  return (
    <>
      <QueryClientProvider client={client}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Toaster />
          <Layout />
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
