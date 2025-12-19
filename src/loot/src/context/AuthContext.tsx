import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

type AuthState =
  | { status: "loading" }
  | {
      status: "authenticated";
      membershipId: string;
      membershipType: number;
      bungieName: string;
    } // add more fields as needed
  | { status: "unauthenticated" }
  | { status: "error"; error: Error };

type AuthContextType = {
  auth: AuthState;
};

type AuthResponse = {
  membershipId: string;
  bungieName: string;
  membershipType: number;
  msg: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
          `${global.SERVICE_URL}/api/d2/authorize?${searchParams.toString()}`,
          {
            credentials: "include",
            mode: "cors",
          }
        );

        if (response.status === 401 || response.status === 403) {
          setAuth({ status: "unauthenticated" });
          window.location.href =
            // @ts-expect-error cant figure out typing globalThis specifically for local dev with vite
            `${global.BNET}/en/OAuth/Authorize?client_id=${global.CLIENT_ID}&response_type=code&state=777`;
          return;
        }

        if (!response.ok) {
          throw new Error("Auth check failed");
        }

        const data = (await response.json()) as AuthResponse;
        console.log(data);
        if (data.msg === "success" || data.msg === "still authorized") {
          setAuth({
            status: "authenticated",
            membershipId: data.membershipId,
            membershipType: data.membershipType,
            bungieName: data.bungieName,
          });
        }

        // Clean up code/state params after successful auth
        if (searchParams.get("code")) {
          setSearchParams((prev) => {
            prev.delete("code");
            prev.delete("state");
            return prev;
          });
        }
      } catch (err) {
        setAuth({
          status: "error",
          error: err instanceof Error ? err : new Error("Unknown error"),
        });
      }
    };

    checkAuth();
  }, [searchParams, setSearchParams]);

  return (
    <AuthContext.Provider value={{ auth }}>{children}</AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
