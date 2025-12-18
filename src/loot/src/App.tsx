import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import "./out.css";
import { AuthProvider } from "./context/AuthContext";
const App = () => (
  <div className="bg-gray-100 dark:bg-gray-900 dark:text-white">
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */}
          <Route path={`${global.BASE_PATH}/`} element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </div>
);

export default App;
