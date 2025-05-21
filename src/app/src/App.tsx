import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StatPage from "./pages/Stats";
import NotFound from "./pages/NotFound";
import "./out.css";
const App = () => (
  <div className="bg-gray-100 dark:bg-gray-900 dark:text-white">
      <BrowserRouter>
        <Routes>
          {/* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */}
          <Route path={`${global.BASE_PATH}/`} element={<Home />} />
          {/* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */}
          <Route path={`${global.BASE_PATH}/player/:userId`} element={<StatPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  </div>
);

export default App;