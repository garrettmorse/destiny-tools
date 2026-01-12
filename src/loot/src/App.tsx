import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import "./out.css";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";

const App = () => (
  <div className="bg-gray-100 dark:bg-gray-900 dark:text-white">
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
            <Route
              path={`${global.BASE_PATH}/dashboard`}
              element={<Dashboard />}
            />
            <Route path={`${global.BASE_PATH}/`} element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </div>
);

export default App;
