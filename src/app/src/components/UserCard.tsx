import BarGraph from "./BarGraph";
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
    <div className='p-4'>
      <div className="py-4 flex relative min-w-md place-items-center">
        <img className="flex px-4" src={`${global.BNET}/${emblemFullUrl}`} />
          <p className="absolute left-30 bottom-16 text-white text-2xl z-10">{name}</p>
      </div>
      <div className="min-w-screen grid grid-cols-2 gap-4">
        <div className="col-span-2 place-items-center relative max-w-screen sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px] min-h-[242px]">
          <BarGraph 
          labels={weaponKillLabels}  
          dataset={{
            label: "Weapon Kills", 
            data: weaponKillLabels.map((weapon) => weaponKills[weapon]),
            backgroundColor: 'rgba(50, 255, 132, 0.5)'
          }} 
          />
        </div>
        <div className="col-span-1 place-items-center relative max-w-screen sm:min-h-[150px] md:min-h-[200px] lg:min-h-[250px] min-h-[121px]">
          <BarGraph 
          labels={weaponTypes} 
          dataset={{ 
            label: 'Weapon Kills By Ammo Type', 
            data: weaponTypes.map(weaponType => killsByType[weaponType]), 
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }} 
          />
        </div>
        <div className="col-span-1 place-items-center">
          <StatCard kills={totalKills} deaths={totalDeaths} kd={killDeathRatio} />
        </div>
      </div>
  </div>
  );
}

export default UserCard;