interface StatisticProps {
  stat: string | number;
  label: string;
}

const Statistic: React.FC<StatisticProps> = ({ stat, label }) => (
  <div className="text-center">
    <div className="text-3xl font-bold">{stat}</div>
    <div className="dark:text-gray-300">{label}</div>
  </div>
);

export default Statistic;
