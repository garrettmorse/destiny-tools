import Statistic from "./Statistic";

interface StatCardProps {
  kills: number;
  deaths: number;
  kd: number;
  attempts: number;
}

const StatCard: React.FC<StatCardProps> = ({ kills, deaths, kd, attempts }) => {
  return (
    <div className="grid h-full grid-cols-2 bg-white dark:bg-gray-800">
      <div className="bg-gray-100 dark:bg-gray-700 m-2 rounded content-center">
        <Statistic stat={kills} label={`Kill${kills !== 1 ? "s" : ""}`} />
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 m-2 rounded content-center">
        <Statistic stat={deaths} label={`Death${deaths !== 1 ? "s" : ""}`} />
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 m-2 rounded content-center">
        <Statistic stat={kd.toFixed(2)} label="K/D Ratio" />
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 m-2 rounded content-center">
        <Statistic
          stat={attempts}
          label={`Attempt${attempts !== 1 ? "s" : ""}`}
        />
      </div>
    </div>
  );
};

export default StatCard;
