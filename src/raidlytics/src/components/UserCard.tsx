import BarGraph from "../graphs/BarGraph";
import Emblem from "./Emblem";
import StatCard from "./StatCard";
import type { Stats } from "../services/services";

const UserCard: React.FC<Stats> = ({ user, fireteam }) => {
  const {
    name,
    lightLevel,
    attempts,
    totalKills,
    totalDeaths,
    killDeathRatio,
    weaponKills,
    weaponKillsByAmmoType,
    emblemFullUrl,
  } = user;
  const killsByType = Object.entries(weaponKillsByAmmoType).reduce(
    (byAmmoType, [weaponType, killsForType]) => {
      if (
        weaponType !== "Primary" &&
        weaponType !== "Special" &&
        weaponType !== "Heavy"
      ) {
        return byAmmoType;
      }
      byAmmoType[weaponType] += Object.values(killsForType).reduce(
        (sum, kills) => (sum += kills),
        0,
      );
      return byAmmoType;
    },
    { Primary: 0, Special: 0, Heavy: 0 },
  );
  const graphColorA = "rgb(114, 76, 228)";
  const graphColorB = "rgb(178, 228, 158)";

  const fireteamMembers = Object.values(fireteam).filter(
    (o) => typeof o !== "string",
  );
  const weaponTypes = Object.keys(weaponKillsByAmmoType) as (
    | "Primary"
    | "Special"
    | "Heavy"
  )[];
  const weaponKillLabels = Object.keys(weaponKills);
  const fireteamMemberNames = fireteamMembers.map((member) => member.name);
  const fireteamAttempts = fireteamMembers.map((member) => member.attempts);

  return (
    <div className="min-w-screen grid grid-cols-2 gap-4">
      <div className="col-span-2 my-2 justify-self-center px-1 sm:min-w-md">
        <Emblem name={name} lightLevel={lightLevel} emblemUrl={emblemFullUrl} />
      </div>
      <div className="max-sm:col-span-2 sm:col-span-1 max-sm:justify-items-center sm:justify-items-end  relative max-w-screen ">
        <div className="container max-w-md lg:max-w-[500px] h-full shadow-lg sm:min-h-[150px]  md:min-h-[200px] lg:min-h-[250px]  min-h-[172px]">
          <StatCard
            kills={totalKills}
            deaths={totalDeaths}
            kd={killDeathRatio}
            attempts={attempts}
          />
        </div>
      </div>
      <div className="max-sm:col-span-2 sm:col-span-1 max-sm:justify-items-center sm:justify-items-start relative max-w-screen">
        <div className="container place-items-center sm:min-h-[150px] md:min-h-[200px] lg:max-w-[500px] lg:min-h-[250px] min-h-[172px]">
          <BarGraph
            labels={weaponTypes as string[]}
            dataset={{
              label: "Weapon Kills By Ammo Type",
              data: weaponTypes.map((weaponType) => killsByType[weaponType]),
              backgroundColor: graphColorB,
            }}
          />
        </div>
      </div>
      <div className="col-span-2 place-items-center relative max-w-screen">
        <div className="container place-items-center sm:min-h-[300px] md:min-h-[400px] lg:max-w-[900px] lg:min-h-[450px] min-h-[172px]">
          <BarGraph
            labels={weaponKillLabels}
            dataset={{
              label: "Weapon Kills",
              data: weaponKillLabels.map((weapon) => weaponKills[weapon]),
              backgroundColor: graphColorA,
            }}
          />
        </div>
      </div>
      <div className="col-span-2 place-items-center relative max-w-screen">
        <div className="container place-items-center sm:min-h-[300px] md:min-h-[400px] lg:max-w-[900px] lg:min-h-[450px] min-h-[172px]">
          <BarGraph
            labels={fireteamMemberNames}
            dataset={{
              label: `${name}'s Best Friends`,
              data: fireteamAttempts,
              backgroundColor: graphColorA,
            }}
            extendedOptions={{
              plugins: {
                tooltip: {
                  callbacks: {
                    footer: (item) =>
                      `${item[0].raw === attempts ? `A true best friend: ${item[0].label} remained through it all.` : ""}`,
                    label: (item) =>
                      `${item.formattedValue} attempt${item.raw !== 1 ? "s" : ""} with ${name}`,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserCard;
