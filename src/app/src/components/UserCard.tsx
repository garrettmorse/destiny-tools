import BarGraph from "./BarGraph";
import Emblem from "./Emblem";
import StatCard from "./StatCard";

const UserCard: React.FC<UserStats> = ({
  name,
  totalKills,
  totalDeaths,
  killDeathRatio,
  weaponKills,
  weaponKillsByAmmoType,
  emblemFullUrl,
  emblemIconUrl
}) => {
  const killsByType = Object.entries(weaponKillsByAmmoType).reduce((byAmmoType, [weaponType, killsForType]) => {
    if (weaponType !== 'Primary' && weaponType !== "Special" && weaponType !== "Heavy") {
      return byAmmoType;
    }
    byAmmoType[weaponType] += Object.values(killsForType).reduce((sum, kills) => sum += kills, 0);
    return byAmmoType;
  }, { Primary: 0, Special: 0, Heavy: 0 });

  const weaponTypes = Object.keys(weaponKillsByAmmoType);

  const weaponKillLabels = Object.keys(weaponKills);

  return (
      <div className="min-w-screen grid grid-cols-2 gap-4">
        <div className="col-span-2 place-items-center min-w-md">
          <Emblem name={name} emblemUrl={emblemFullUrl} />
        </div>
        <div className="col-span-2 place-items-center relative max-w-screen sm:min-h-[300px] md:min-h-[400px] lg:min-h-[450px] min-h-[242px]">
          <BarGraph 
          labels={weaponKillLabels}  
          dataset={{
            label: "Weapon Kills", 
            data: weaponKillLabels.map((weapon) => weaponKills[weapon]),
            backgroundColor: 'rgba(50, 255, 132, 0.5)'
          }} 
          />
        </div>
        <div className="col-span-1 justify-items-end place-items-center relative max-w-screen sm:min-h-[150px] md:min-h-[200px] lg:min-h-[250px] min-h-[121px]">
          <BarGraph 
          labels={weaponTypes} 
          dataset={{ 
            label: 'Weapon Kills By Ammo Type', 
            data: weaponTypes.map(weaponType => killsByType[weaponType]), 
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }} 
          />
        </div>
        <div className="bg-white col-span-1 justify-items-start place-items-center relative max-w-screen sm:min-h-[150px]  md:min-h-[200px]  lg:min-h-[225px]  min-h-[121px]">
          <StatCard kills={totalKills} deaths={totalDeaths} kd={killDeathRatio} />
        </div>
      </div>
  );
}

export default UserCard;