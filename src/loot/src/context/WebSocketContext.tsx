import { createContext, useContext, ReactNode } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

interface WebSocketContextType {
  status: "connecting" | "connected" | "disconnected" | "error";
  lastMessage: any | null;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  // Determine WebSocket URL based on environment
  const wsUrl =
    process.env.NODE_ENV === "development"
      ? "ws://localhost:8080"
      : `wss://${window.location.host}`;

  const wsConnection = useWebSocket(wsUrl, {
    enableLootPolling: true,
    pollingInterval: 10_000,
  });

  return (
    <WebSocketContext.Provider value={wsConnection}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};
