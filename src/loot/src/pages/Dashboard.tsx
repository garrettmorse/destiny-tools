import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ArmorHeatmap from "../components/ArmorHeatmap";
import ArmorFeed from "../components/ArmorFeed";
import { useNavigate } from "react-router";
import { useWebSocket } from "../hooks/useWebSocket";

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
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [showUserOnly, setShowUserOnly] = useState(false);

  // Determine WebSocket URL based on environment
  const wsUrl =
    process.env.NODE_ENV === "development"
      ? "ws://localhost:8080"
      : `wss://${window.location.host}`;

  const { status: wsStatus, lastMessage } = useWebSocket(wsUrl);

  // Handle WebSocket messages for armor stats updates
  useEffect(() => {
    if (lastMessage?.type === "armorStats") {
      setArmorStats(lastMessage.data);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (auth.status !== "loading" && auth.status !== "authenticated") {
      setLoading(false);
      navigate(global.BASE_PATH || "/");
      return;
    }

    const fetchStats = async () => {
      try {
        let url = `${global.SERVICE_URL}/api/d2/armorStats`;
        const params = new URLSearchParams();
        if (selectedGhostMod) {
          params.append("ghost_mod", selectedGhostMod);
        }
        if (showUserOnly) {
          params.append("user_only", "true");
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
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

    // Initial fetch only - WebSocket will handle updates
    fetchStats();
  }, [auth.status, selectedGhostMod, showUserOnly, navigate]);

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
    "All Armor",
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
    <div
      className={`min-h-screen bg-gray-900 text-white relative${
        loading ? " pointer-events-none" : ""
      }`}
    >
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
                Community Tier 5 Armor Statistics
              </h1>
              {wsStatus === "connected" && (
                <span className="max-sm:text-xs sm:text-sm text-green-400">
                  (Live)
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="flex items-center gap-2 max-sm:text-xs sm:text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUserOnly}
                  onChange={(e) => setShowUserOnly(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-800 border border-gray-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span>My Stats Only</span>
              </label>
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
                <option value="">All</option>
                {ghostMods.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
                <option value="NONE">No Ghost Mod</option>
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
                isLoading={loading}
              />
            ))}
          </div>
        </div>
        {/* Right rail - armor feed (desktop: always visible, mobile: flyout) */}
        <div
          className={`
            fixed lg:static top-0 right-0 h-screen max-sm:w-full sm:w-96
            bg-gray-900 lg:bg-transparent
            border-l border-gray-700
            transform lg:transform-none transition-transform duration-300 ease-in-out
            z-40
            ${
              isFeedOpen
                ? `max-sm:translate-x-0`
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
