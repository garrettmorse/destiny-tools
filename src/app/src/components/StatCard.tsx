import Statistic from "./Statistic";

interface StatCardProps {
  kills: number;
  deaths: number;
  kd: number;
  attempts: number;
};

const StatCard: React.FC<StatCardProps> = ({ kills, deaths, kd, attempts }) => {
  return (
    <div className="grid h-full grid-cols-2">
      
      <div className="content-center">
        <Statistic stat={kills} label="Kills" />
      </div>
      <div className="content-center">
        <Statistic stat={deaths} label="Deaths" />
      </div>
      <div className="content-center">
        <Statistic stat={kd.toFixed(2)} label="K/D Ratio" />
      </div>
      <div className="content-center">
        <Statistic stat={attempts} label="Attempts" />
      </div>
    </div>
  );
};

export default StatCard;