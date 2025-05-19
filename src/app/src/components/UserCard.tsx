import BarGraph from "./BarGraph";
import Emblem from "./Emblem";
import StatCard from "./StatCard";

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
  const killsByType = Object.entries(weaponKillsByAmmoType).reduce((byAmmoType, [weaponType, killsForType]) => {
    if (weaponType !== 'Primary' && weaponType !== "Special" && weaponType !== "Heavy") {
      return byAmmoType;
    }
    byAmmoType[weaponType] += Object.values(killsForType).reduce((sum, kills) => sum += kills, 0);
    return byAmmoType;
  }, { Primary: 0, Special: 0, Heavy: 0 });

  const weaponTypes = Object.keys(weaponKillsByAmmoType) as ("Primary" | "Special" | "Heavy")[];

  const weaponKillLabels = Object.keys(weaponKills);

  const fireteamMembers = Object.values(fireteam).map(member => member.name);
  const fireteamAttempts = Object.values(fireteam).map(member => member.attempts);
  return (
      <div className="min-w-screen grid grid-cols-2 gap-4">
        <div className="col-span-2 my-2 lg:col-span-1 justify-self-center lg:justify-self-end  px-1 sm:min-w-md">
          <Emblem name={name} lightLevel={lightLevel} emblemUrl={emblemFullUrl} />
        </div>
        <div className="col-span-2 place-items-center relative max-w-screen">
          <div className="container place-items-center sm:min-h-[300px] md:min-h-[400px] lg:max-w-[900px] lg:min-h-[450px] min-h-[172px]">
            <BarGraph 
            labels={weaponKillLabels}  
            dataset={{
              label: "Weapon Kills", 
              data: weaponKillLabels.map((weapon) => weaponKills[weapon]),
              backgroundColor: 'rgba(50, 255, 132, 0.5)'
            }} 
            />
          </div>
        </div>
        <div className="max-sm:col-span-2 sm:col-span-1 max-sm:justify-items-center sm:justify-items-end relative max-w-screen">
          <div className="container place-items-center sm:min-h-[150px] md:min-h-[200px] lg:max-w-[500px] lg:min-h-[250px] min-h-[172px]">
            <BarGraph 
            labels={weaponTypes as string[]} 
            dataset={{ 
              label: 'Weapon Kills By Ammo Type', 
              data: weaponTypes.map(weaponType => killsByType[weaponType]), 
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }} 
            />
          </div>
        </div>
        <div className="max-sm:col-span-2 sm:col-span-1 max-sm:justify-items-center sm:justify-items-start  relative max-w-screen ">
          <div className="container max-w-md lg:max-w-[500px] h-full dark:bg-gray-900 shadow-lg sm:min-h-[150px]  md:min-h-[200px] lg:min-h-[250px]  min-h-[172px]">
            <StatCard kills={totalKills} deaths={totalDeaths} kd={killDeathRatio} attempts={attempts} />
          </div>
        </div>
        <div className="col-span-2 place-items-center relative max-w-screen">
          <div className="container place-items-center sm:min-h-[300px] md:min-h-[400px] lg:max-w-[900px] lg:min-h-[450px] min-h-[172px]">
            <BarGraph 
            labels={fireteamMembers}  
            dataset={{
              label: `${name}'s Best Friends`, 
              data: fireteamAttempts,
              backgroundColor: 'rgba(50, 255, 132, 0.5)'
            }} 
            extendedOptions={{
              plugins: {
                tooltip: {
                  callbacks: {
                    footer: (item) => `${item[0].raw === attempts ? `A true best friend: ${item[0].label} remained through it all.` : ''}`,
                    label: (item) => `${item.formattedValue} attempt${item.raw !== 1 ? 's' : ''} with ${name}`
                  }
                }
              }
            }}
            />
          </div>
        </div>
      </div>
  );
}

export default UserCard;