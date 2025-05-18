interface StatisticProps {
  stat: string | number;
  label: string;
};

const Statistic: React.FC<StatisticProps> = ({ stat, label }) => (
  <div className="text-center">
    <div className="text-4xl">
      {stat}
    </div>
    <div>
      {label}
    </div>
  </div>
)

export default Statistic;