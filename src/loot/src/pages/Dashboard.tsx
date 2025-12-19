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
  const [isFeedOpen, setIsFeedOpen] = useState(false);

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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-red-500">Error</p>
        <p>
          Something went really wrong. If refreshing the page doesn't work,
          please try again later.
        </p>
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
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Hamburger menu button - visible on mobile only */}
      <button
        onClick={() => setIsFeedOpen(!isFeedOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
        aria-label="Toggle armor feed"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isFeedOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      <div className="flex">
        {/* Main panel - heatmaps */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto h-screen">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
            <div className="flex items-center gap-3">
              <h1 className="max-sm:text-2xl sm:text-3xl md:text-4xl font-bold">
                Community Armor Statistics
              </h1>
              {isPolling && (
                <span className="max-sm:text-xs sm:text-sm text-green-400">
                  (Live)
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label
                htmlFor="ghost-mod-filter"
                className="text-sm text-gray-400"
              >
                Filter by Ghost Mod:
              </label>
              <select
                id="ghost-mod-filter"
                className="cursor-pointer hover:border-white bg-gray-800 border border-gray-700 rounded px-3 sm:px-4 py-2 text-white text-sm sm:text-base"
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
          <div className="space-y-6 max-lg:space-y-8">
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

        {/* Right rail - armor feed (desktop: always visible, mobile: flyout) */}
        <div
          className={`
            fixed lg:static top-0 right-0 h-screen max-lg:w-full lg:w-96
            bg-gray-900 lg:bg-transparent
            border-l border-gray-700
            transform lg:transform-none transition-transform duration-300 ease-in-out
            z-40
            ${
              isFeedOpen
                ? "translate-x-0"
                : "max-lg:translate-x-full translate-x-0"
            }
          `}
        >
          <ArmorFeed />
        </div>
      </div>

      {/* Overlay for mobile when feed is open */}
      {isFeedOpen && (
        <div className="lg:hidden" onClick={() => setIsFeedOpen(false)} />
      )}
    </div>
  );
}
