import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Stats from "./pages/Stats";
import NotFound from "./pages/NotFound";
import "./out.css";
const App = () => (
  <div className="dark:bg-gray-800 dark:text-white">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/player/:userId" element={<Stats />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  </div>
);

export default App;