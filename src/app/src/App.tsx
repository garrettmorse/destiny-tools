import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PlayerPage from "./pages/PlayerPage";
import NotFound from "./pages/NotFound";
import "./out.css";

const queryClient = new QueryClient();

const App = () => (
  <div className="dark:bg-gray-800 dark:text-white">
  <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/player/:userId" element={<PlayerPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  </QueryClientProvider>
  </div>
);

export default App;