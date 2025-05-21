import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineGraphProps { 
  tableName: string; 
  labels: string[]; 
  datasets: { 
    label: string; 
    data: number[] | string[]; 
    yTitle: string; 
    yAxisID: string; 
    fill?: { target: string; } | boolean; 
    backgroundColor: string; 
    borderColor: string; 
    pointBackgroundColor: string;
    axisRange?: [number, number],
  }[];  
}

const Graph: React.FC<LineGraphProps> = ({ tableName, labels, datasets }) => {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  ChartJS.defaults.color = isDark ? "white": "black";
  const defaultOptions: React.ComponentProps<typeof Line>['options'] = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
          align: "start",
          fullSize: true,
          display: true,
          text: '  ' + tableName,
          font: {
            size: 16
          }
        },
    },
    scales: {
      y: {
        title: {
          text: datasets[0].yTitle,
          align: 'center',
          display: true,
        },
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        stacked: false,
      },
      y1: {
        title: {
          text: datasets[1].yTitle,
          align: 'center',
          display: true,
        },
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: datasets[1]?.axisRange?.at(0),
        max: datasets[1]?.axisRange?.at(1),
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
  return <Line className="bg-white dark:bg-gray-800 shadow-lg" options={defaultOptions} data={{ labels, datasets }} />
};

export default Graph;