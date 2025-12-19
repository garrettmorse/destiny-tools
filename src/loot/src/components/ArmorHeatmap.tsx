type ArmorHeatmapProps = {
  slot: string;
  data: {
    [archetype: string]: {
      [tertiary: string]: number;
    };
  };
  ghostMod: string | null;
};

const archetypes = [
  "Gunner",
  "Grenadier",
  "Paragon",
  "Brawler",
  "Bulwark",
  "Specialist",
];

const tertiaryStats = [
  "Weapons",
  "Grenade",
  "Super",
  "Melee",
  "Health",
  "Class",
];

// Map archetype to color
const archetypeColors: { [key: string]: string } = {
  Specialist: "bg-purple-600",
  Gunner: "bg-red-600",
  Bulwark: "bg-blue-600",
  Grenadier: "bg-green-600",
  Paragon: "bg-yellow-600",
  Brawler: "bg-orange-600",
};

export default function ArmorHeatmap({
  slot,
  data,
  ghostMod,
}: ArmorHeatmapProps) {
  // Find the max count for scaling
  const maxCount = Math.max(
    ...Object.values(data).flatMap((archetypeData) =>
      Object.values(archetypeData)
    ),
    1
  );

  const getOpacity = (count: number): number => {
    if (count === 0) return 0.1;
    return 0.2 + (count / maxCount) * 0.8;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{slot}</h2>
        {ghostMod && (
          <span className="text-sm text-green-400 bg-gray-700 px-3 py-1 rounded">
            {ghostMod}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left border border-gray-700">
                Archetype \ Tertiary
              </th>
              {tertiaryStats.map((stat) => (
                <th
                  key={stat}
                  className="p-2 text-center border border-gray-700 text-sm"
                >
                  {stat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {archetypes.map((archetype) => (
              <tr key={archetype}>
                <td className="p-2 border border-gray-700 font-medium">
                  {archetype}
                </td>
                {tertiaryStats.map((stat) => {
                  const count = data[archetype]?.[stat] || 0;
                  const opacity = getOpacity(count);
                  const baseColor = archetypeColors[archetype] || "bg-gray-600";

                  return (
                    <td
                      key={stat}
                      className={`p-2 border border-gray-700 text-center ${baseColor}`}
                      style={{ opacity }}
                    >
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
