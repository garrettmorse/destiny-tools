import {
  archetypes,
  tertiaryStats,
  archetypeColors,
  archetypeStatMapping,
} from "../constants/armor";

type ArmorHeatmapProps = {
  slot: string;
  data: {
    [archetype: string]: {
      [tertiary: string]: number;
    };
  };
  ghostMod: string | null;
  isLoading: boolean;
};

export default function ArmorHeatmap({
  slot,
  data,
  ghostMod,
  isLoading,
}: ArmorHeatmapProps) {
  // Find the max count for scaling
  const maxCount = Math.max(
    ...Object.values(data).flatMap((archetypeData) =>
      Object.values(archetypeData)
    ),
    1
  );

  // Calculate total count
  const totalCount = Object.values(data).reduce(
    (sum, archetypeData) =>
      sum + Object.values(archetypeData).reduce((a, b) => a + b, 0),
    0
  );

  const getOpacity = (count: number): number => {
    if (count === 0) return 0.1;
    return 0.2 + (count / maxCount) * 0.8;
  };

  const isImpossibleCombination = (
    archetype: string,
    tertiary: string
  ): boolean => {
    const mapping = archetypeStatMapping[archetype];
    if (!mapping) return false;
    return tertiary === mapping.primary || tertiary === mapping.secondary;
  };

  /**
 * <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-7 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-5 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-700 rounded w-2/3"></div>
                      <div className="h-6 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/5"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
 */

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="max-sm:text-lg sm:text-xl md:text-2xl font-semibold">
          {slot}
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoading ? (
            <div className="bg-gray-800 animate-pulse">
              <div className="w-5 h-4 rounded bg-gray-700"></div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm sm:text-base">
              n={totalCount}
            </span>
          )}
          {ghostMod && (
            <span className="max-sm:text-xs sm:text-sm text-green-400 bg-gray-700 px-2 sm:px-3 py-1 rounded">
              {ghostMod === "NONE" ? "No Ghost Mod" : ghostMod}
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr>
              <th className="p-1 sm:p-2 text-left border border-gray-700 max-sm:text-xs sm:text-md sticky left-0 bg-gray-800 z-10">
                Archetype \ Tertiary
              </th>
              {tertiaryStats.map((stat) => (
                <th
                  key={stat}
                  className="p-1 sm:p-2 text-center border border-gray-700 max-sm:text-xs sm:text-sm whitespace-nowrap"
                >
                  {stat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {archetypes.map((archetype) => (
              <tr key={archetype}>
                <td className="p-1 sm:p-2 border border-gray-700 font-medium max-sm:text-xs sm:text-md sticky left-0 bg-gray-800 z-10">
                  {archetype}
                </td>

                {tertiaryStats.map((stat) => {
                  const count = data[archetype]?.[stat] || 0;
                  const opacity = isLoading ? 0.2 : getOpacity(count);
                  const baseColor =
                    archetypeColors.bg[archetype] || "bg-gray-600";
                  const impossible = isImpossibleCombination(archetype, stat);
                  return (
                    <td
                      key={stat}
                      className={`relative ${
                        isLoading && !impossible
                          ? "animate-pulse bg-gray-600"
                          : `${baseColor} p-1 sm:p-2`
                      } border border-gray-700 font-semibold items-center text-center max-sm:text-xs sm:text-sm `}
                      style={{ opacity: impossible ? 0.05 : opacity }}
                    >
                      {impossible && (
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          preserveAspectRatio="none"
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2="100%"
                            y2="100%"
                            stroke="rgb(229, 231, 235)"
                            strokeWidth="2"
                          />
                          <line
                            x1="100%"
                            y1="0"
                            x2="0"
                            y2="100%"
                            stroke="rgb(229, 231, 235)"
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
