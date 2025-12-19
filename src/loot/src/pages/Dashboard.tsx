import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ArmorHeatmap from "../components/ArmorHeatmap";
import ArmorFeed from "../components/ArmorFeed";
import { useNavigate } from "react-router";

type ArmorStats = {
  [slot: string]: {
    [archetype: string]: {
      [tertiary: string]: number;
    };
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [armorStats, setArmorStats] = useState<ArmorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGhostMod, setSelectedGhostMod] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated") {
      setLoading(false);
      setIsPolling(false);
      /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
      navigate(global.BASE_PATH || "/");
      return;
    }

    const fetchStats = async () => {
      try {
        /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
        let url = `${global.SERVICE_URL}/api/d2/armorStats`;
        if (selectedGhostMod) {
          url += `?ghost_mod=${encodeURIComponent(selectedGhostMod)}`;
        }

        const res = await fetch(url, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch armor stats");
        }

        const data = await res.json();
        setArmorStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();

    // Set up polling every 30 seconds
    setIsPolling(true);
    const interval = setInterval(() => {
      console.log("Polling for updated community stats...");
      fetchStats();
    }, 30_000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [auth.status, selectedGhostMod, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading armor statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Error: {error}</p>
      </div>
    );
  }

  const slots = [
    "Helmet",
    "Gauntlets",
    "Chest Armor",
    "Leg Armor",
    "Class Armor",
  ];

  const ghostMods = [
    "Gunner Armorer",
    "Grenadier Armorer",
    "Paragon Armorer",
    "Brawler Armorer",
    "Bulwark Armorer",
    "Specialist Armorer",
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Main panel - heatmaps */}
        <div className="flex-1 p-8 overflow-y-auto h-screen">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">Community Armor Statistics</h1>
              {isPolling && (
                <span className="text-sm text-green-400">(Live)</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-4">
              <label
                htmlFor="ghost-mod-filter"
                className="text-sm text-gray-400"
              >
                Filter by Ghost Mod:
              </label>
              <select
                id="ghost-mod-filter"
                className="cursor-pointer hover:border-white bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                value={selectedGhostMod || ""}
                onChange={(e) => setSelectedGhostMod(e.target.value || null)}
              >
                <option value="">All Mods</option>
                {ghostMods.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-8">
            {slots.map((slot) => (
              <ArmorHeatmap
                key={slot}
                slot={slot}
                data={armorStats?.[slot] || {}}
                ghostMod={selectedGhostMod}
              />
            ))}
          </div>
        </div>

        {/* Right rail - armor feed */}
        <div className="w-96 border-l border-gray-700">
          <ArmorFeed />
        </div>
      </div>
    </div>
  );
}
