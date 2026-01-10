import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

// Types
type AuthState = {
  membershipId: string;
  // ... whatever your /api/d2/authorize returns
};

type UseAuthorizeResult =
  | { status: "idle" | "loading" }
  | { status: "redirect" }
  | { status: "success"; data: AuthState }
  | { status: "error"; error: Error };

/**
 * Custom hook to handle Bungie OAuth callback and authorization state
 */
export const useBungieAuth = (): UseAuthorizeResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<UseAuthorizeResult>({
    status: "loading",
  });

  useEffect(() => {
    const handleAuthorization = async () => {
      try {
        // If there's a 'code' param, we're in the OAuth callback
        const code = searchParams.get("code");

        const response = await fetch(
          `${global.SERVICE_URL}/api/d2/authorize${
            searchParams.toString() ? `?${searchParams.toString()}` : ""
          }`,
          {
            method: "GET",
            credentials: "include", // important for cookies/sessions
            mode: "cors",
          }
        );

        if (response.status === 401) {
          setResult({ status: "redirect" });
          return;
        }

        if (!response.ok) {
          throw new Error("Authorization failed");
        }

        const data: AuthState = await response.json();

        // Only clean up the code/state params if we successfully processed them
        if (code) {
          setSearchParams((prev) => {
            prev.delete("code");
            prev.delete("state"); // also remove state param if present
            return prev;
          });
        }

        setResult({ status: "success", data });
      } catch (err) {
        setResult({
          status: "error",
          error: err instanceof Error ? err : new Error("Unknown error"),
        });
      }
    };

    handleAuthorization();
  }, [searchParams, setSearchParams]); // Re-run if search params change (e.g., on redirect back)

  // If no code and we're not loading, assume we're in normal state
  // You might want to check session separately if using cookie auth
  return result;
};
