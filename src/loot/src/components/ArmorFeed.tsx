import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

type ArmorPiece = {
  instance_id: string;
  item_hash: number;
  name: string;
  slot: string;
  archetype: string;
  tertiary: string;
  ghost_mod: string;
  icon: string;
  class: string;
  armorSet: string | null;
};

export default function ArmorFeed() {
  const { auth } = useAuth();
  const [newArmor, setNewArmor] = useState<ArmorPiece[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.status !== "authenticated") {
      setNewArmor([]);
      setIsPolling(false);
      /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
      navigate(global.BASE_PATH || "/");
      return;
    }

    // Fetch recent armor on mount
    const fetchRecentArmor = async () => {
      try {
        /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
        const res = await fetch(`${global.SERVICE_URL}/api/d2/recentArmor`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setNewArmor(data);
        }
      } catch (err) {
        console.error("Failed to fetch recent armor:", err);
      }
    };

    fetchRecentArmor();

    setIsPolling(true);
    const interval = setInterval(async () => {
      console.log("Polling for new loot...");
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
          }
        }
      } catch (err) {
        console.error("Loot poll error:", err);
      }
    }, 10_000); // every 10 seconds

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [auth.status, navigate]);

  return (
    <div className="h-screen overflow-y-auto bg-gray-850">
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <h2 className="text-xl font-semibold">
          Your Recent Drops{" "}
          {isPolling && <span className="text-green-400">(Live)</span>}
        </h2>
      </div>
      <div className="p-4">
        {newArmor.length === 0 ? (
          <p className="text-gray-400 text-center mt-8">
            No drops detected yet. Go farm some tier 5 legendary armor!
          </p>
        ) : (
          <div className="space-y-3">
            {newArmor.map((armor, index) => {
              // Calculate opacity based on position (most recent = 100%, fades to 60%)
              const opacity = Math.max(60, 100 - (index * 2));
              const borderOpacity = Math.max(50, 100 - (index * 3));

              return (
              <div
                key={armor.instance_id}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-all duration-300"
                style={{
                  opacity: `${opacity}%`,
                  borderColor: `rgb(55 65 81 / ${borderOpacity}%)`,
                }}
              >
                <div className="flex gap-3">
                  {/* Item icon */}
                  <div className="flex-shrink-0">
                    <a
                      href={`https://www.light.gg/db/items/${armor.item_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={`https://www.bungie.net${armor.icon}`}
                        alt={armor.name}
                        className="w-16 h-16 rounded"
                      />
                    </a>
                  </div>

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://www.light.gg/db/items/${armor.item_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-white hover:text-blue-400 transition-colors block truncate"
                    >
                      {armor.name}
                    </a>

                    <div className="text-sm text-gray-400 space-y-1 mt-1">
                      <div className="flex gap-2">
                        <span className="text-gray-500">Class:</span>
                        <span>{armor.class}</span>
                      </div>

                      {armor.armorSet && (
                        <div className="flex gap-2">
                          <span className="text-gray-500">Set:</span>
                          <span>{armor.armorSet}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <span className="text-gray-500">Archetype:</span>
                        <span className="text-purple-400">
                          {armor.archetype}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-gray-500">Tertiary:</span>
                        <span className="text-blue-400">{armor.tertiary}</span>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-gray-500">Ghost Mod:</span>
                        <span className="text-green-400">
                          {armor.ghost_mod === "" ? "None" : armor.ghost_mod}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
