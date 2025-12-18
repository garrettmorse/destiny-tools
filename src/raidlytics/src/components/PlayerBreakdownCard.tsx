import { useState } from "react";
import StatCard from "./StatCard.tsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import BarGraph from "../graphs/BarGraph.tsx";
import type { UserStats } from "../services/services.d.ts";

const PlayerBreakdownCard: React.FC<{
  fireteam: Record<string, UserStats>;
}> = ({ fireteam }) => {
  const [selectedMember, setSelectedMember] = useState(
    Object.keys(fireteam)[0],
  );
  const navigate = useNavigate();
  const [searchParams, _] = useSearchParams();
  const memberSelectOptions = [];
  const memberTopWeapons: Record<string, Record<string, number>> = {};
  for (const [hash, stats] of Object.entries(fireteam)) {
    memberSelectOptions.push(
      <option key={hash} value={hash}>
        {stats.name}
      </option>,
    );
    memberTopWeapons[hash] = Object.fromEntries(
      Object.entries(stats.weaponKills).slice(0, 5),
    );
  }

  const handleIconClick = () => {
    const result = searchParams.get("raid");
    navigate(
      /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
      `${global.BASE_PATH}/player/${selectedMember}${
        result ? `?raid=${result}` : ""
      }`,
    );
  };

  return (
    <div className="w-full p-2 bg-white dark:bg-gray-800 rounded">
      <h2 className="text-lg font-bold mb-4">Fireteam Insights</h2>
      <div className="mb-2">
        <label>Select a Fireteam Member</label>
        <select
          className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
        >
          {memberSelectOptions}
        </select>
      </div>
      <div>
        <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="mb-10">
            <h3 className="flex text-md font-semibold mb-2">
              <img
                onClick={handleIconClick}
                className="cursor-pointer mr-2 "
                width={25}
                /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
                src={`${global.BNET}/${fireteam[selectedMember].emblemIconUrl}`}
              />
              {fireteam[selectedMember].name} - {fireteam[selectedMember].class}
            </h3>
            <div className="h-full">
              <StatCard
                kills={fireteam[selectedMember].totalKills}
                deaths={fireteam[selectedMember].totalDeaths}
                kd={fireteam[selectedMember].killDeathRatio}
                attempts={fireteam[selectedMember].attempts}
              />
            </div>
          </div>
          <div className="place-items-center">
            <BarGraph
              labels={Object.keys(memberTopWeapons[selectedMember])}
              dataset={{
                label: "Top Weapons",
                data: Object.values(memberTopWeapons[selectedMember]),
                backgroundColor: "rgb(114, 76, 228)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerBreakdownCard;
