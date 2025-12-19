import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type ArmorPiece = {
  instance_id: string;
  item_hash: number;
  name: string;
  archetype: string;
  tertiary: string;
  ghost_mod?: string;
};

export default function LootTracker() {
  const { auth } = useAuth();
  const [newArmor, setNewArmor] = useState<ArmorPiece[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated") {
      setNewArmor([]);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(async () => {
      console.log("Polling...");
      try {
        /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
        const res = await fetch(`${global.SERVICE_URL}/api/d2/pollLoot`, {
          credentials: "include",
        });

        if (res.status === 401) {
          // Token may be expired, attempt refresh via authorize endpoint
          console.warn("Poll returned 401, attempting token refresh...");
          const refreshRes = await fetch(
            /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
            `${global.SERVICE_URL}/api/d2/authorize`,
            {
              credentials: "include",
            }
          );

          if (refreshRes.ok) {
            // Token refreshed successfully — retry the original poll
            console.log("Token refreshed, retrying poll...");
            const retryRes = await fetch(
              /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
              `${global.SERVICE_URL}/api/d2/pollLoot`,
              {
                credentials: "include",
              }
            );
            if (retryRes.ok) {
              const data = await retryRes.json();
              if (data.new?.length > 0) {
                setNewArmor((prev) => [...data.new, ...prev]);
              }
            }
            return; // Exit early after successful retry
          } else {
            // Refresh failed - refresh token is invalid, redirect to re-authenticate
            console.error("Token refresh failed, redirecting to OAuth...");
            /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
            window.location.href = `${global.BNET}/en/OAuth/Authorize?client_id=${global.CLIENT_ID}&response_type=code&state=777`;
            return;
          }
        }

        if (res.ok) {
          const data = await res.json();
          if (data.new?.length > 0) {
            setNewArmor((prev) => [...data.new, ...prev]); // prepend new
            // Optional: play sound, toast notification, etc.
          }
        }
      } catch (err) {
        console.error("Loot poll error:", err);
        // Could add retry logic or error state
      }
    }, 10_000); // every 10 seconds — adjust as needed

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [auth.status]);

  if (auth.status !== "authenticated") {
    return <div>Not authenticated.</div>; // or show "Login to track loot"
  }

  return (
    <div className="loot-tracker">
      <h2>Recent Armor Drops {isPolling && <span>(Live)</span>}</h2>
      {newArmor.length === 0 ? (
        <p>No drops detected yet. Go farm some tier 5 legendary armor!</p>
      ) : (
        <div className="armor-list">
          {newArmor.map((armor) => (
            <div key={armor.instance_id} className="armor-card">
              <a
                href={`https://www.light.gg/db/items/${armor.item_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="armor-name"
              >
                {armor.name}
              </a>
              <div className="armor-details">
                <span className="armor-archetype">
                  <strong>Archetype:</strong> {armor.archetype}
                </span>
                <span className="armor-tertiary">
                  <strong>Tertiary:</strong> {armor.tertiary}
                </span>
                {armor.ghost_mod && (
                  <span className="armor-ghost-mod">
                    <strong>Ghost Mod:</strong> {armor.ghost_mod}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
