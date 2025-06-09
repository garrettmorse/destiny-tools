interface RaidCardProps {
  isActive: boolean;
  raid: string;
  splash: string;
}

const RaidCard: React.FC<RaidCardProps> = ({ isActive, raid, splash }) => {
  return (
    <div className="flex relative text-center max-w-sm justify-center-safe place-items-center">
      <img
        className={
          (isActive ? "ring-2" : "") +
          " border ring-black hover:ring-4 dark:ring-white transition-colors duration-200 rounded-xl flex"
        }
        /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
        src={`${global.BNET}/${splash}`}
      ></img>
      <p className="absolute pointer-events-none text-xs sm:text-xs text-white font-bold px-2 z-10">
        {raid}
      </p>
    </div>
  );
};

export default RaidCard;
