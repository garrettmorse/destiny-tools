import PieGraph from "../graphs/PieGraph";
import LineGraph from "../graphs/LineGraph";
import PlayerBreakdownCard from "./PlayerBreakdownCard";
import type { Stats } from "../services/services";

const CLASS_COLORS = {
  Titan: "rgb(240,71,71)",
  Warlock: "rgb(255,215,0)",
  Hunter: "rgb(37, 150, 190)",
};
const Fireteam: React.FC<Stats> = ({ user, fireteam }) => {
  const { timePlayed, killsByPeriod, class: userClassName } = user;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { periodRange, ...members } = fireteam;
  const totalKillsByPeriod = structuredClone(killsByPeriod);
  const fireteamMembers = Object.values(members);
  const totalTimePlayedByPeriod = Object.values(timePlayed)
    .map((seconds) => seconds / 60)
    .reverse();
  const fireteamKills: [string, number][] = [];
  const fireteamClasses: Record<string, number> = { [userClassName]: 1 };
  for (const member of fireteamMembers) {
    fireteamKills.push([member.name, member.totalKills]);
    Object.keys(member.killsByPeriod).forEach(
      (period) => (totalKillsByPeriod[period] += member.killsByPeriod[period]),
    );
    if (!(member.class in fireteamClasses)) {
      fireteamClasses[member.class] = 1;
    } else {
      fireteamClasses[member.class]++;
    }
  }
  fireteamKills.sort(([, a], [, b]) => b - a);
  const totalFireteamKills = fireteamKills.reduce(
    (sum, [, kills]) => (sum += kills),
    0,
  );

  return (
    <div className="min-w-screen grid grid-cols-2 h-full gap-4">
      <div className="max-sm:col-span-2 place-items-center sm:col-span-1 max-w-screen">
        <div className="container max-sm:place-items-center sm:place-items-end max-sm:max-h-[372px] md:min-h-[377px] lg:min-h-[500px] max-h-[500px] max-w-screen">
          <PieGraph
            tableName="Kill Distribution"
            labels={fireteamKills.map((o) => o[0])}
            format={(item: { raw: number }) =>
              `${((item.raw as number) * 100).toFixed(2)}%`
            }
            dataset={{
              label: "Total Fireteam Kills",
              data: fireteamKills.map((o) => o[1] / totalFireteamKills),
            }}
          />
        </div>
      </div>
      <div className="max-sm:col-span-2 place-items-center sm:col-span-1 max-w-screen">
        <div className="container max-sm:place-items-center sm:place-items-start max-sm:max-h-[372px] md:min-h-[377px] lg:min-h-[500px] max-h-[500px] max-w-screen">
          <PieGraph
            tableName="Class Distribution"
            labels={Object.keys(fireteamClasses)}
            format={(item: { label: string; raw: number }) =>
              ` ${item.raw} ${item.label}${item.raw !== 1 ? "s" : ""}`
            }
            dataset={{
              label: "",
              data: Object.values(fireteamClasses),
              backgroundColor: Object.keys(fireteamClasses).map(
                (_class: string) =>
                  CLASS_COLORS[_class as "Titan" | "Warlock" | "Hunter"],
              ),
            }}
          />
        </div>
      </div>
      <div className="col-span-2 place-items-center relative max-w-screen">
        <div className="container place-items-center sm:min-h-[300px] md:min-h-[400px] lg:max-w-[900px] lg:min-h-[450px] min-h-[172px]">
          <LineGraph
            tableName="Session Timeline"
            labels={Object.keys(timePlayed).reverse()}
            datasets={[
              {
                label: "Kills",
                data: Object.values(totalKillsByPeriod).reverse(),
                yTitle: "Total Kills",
                yAxisID: "y",
                fill: { target: "1" },
                backgroundColor: "rgba(114, 76, 228, 0.1)",
                borderColor: "rgb(114, 76, 228)",
                pointBackgroundColor: "rgb(114, 76, 228)",
              },
              {
                label: "Duration (min)",
                data: totalTimePlayedByPeriod,
                yTitle: "Duration (min)",
                yAxisID: "y1",
                fill: true,
                backgroundColor: "rgba(178, 228, 158, 0.1)",
                borderColor: "rgb(178, 228, 158)",
                pointBackgroundColor: "rgb(178, 228, 158)",
                axisRange: [
                  totalTimePlayedByPeriod[0],
                  totalTimePlayedByPeriod[totalTimePlayedByPeriod.length - 1],
                ],
              },
            ]}
          />
        </div>
      </div>
      <div className="col-span-2 place-items-center relative max-w-screen">
        <div className="container place-items-center">
          <PlayerBreakdownCard fireteam={members} />
        </div>
      </div>
    </div>
  );
};

export default Fireteam;
