import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors
} from 'chart.js';
import { Bar } from 'react-chartjs-2';



ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors
);



const Graph: React.FC<{ labels: string[]; dataset: { label: string; data: number[]; backgroundColor: string; }}> = ({ labels, dataset }) => {
  const graphRef = useRef(null);

  // for customizing chartjs since tailwind can't
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  ChartJS.defaults.color = isDark ? "white": "black";
  return (
      <Bar className="bg-white dark:bg-gray-900 shadow-lg" ref={graphRef} options={{
          responsive: true,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          layout: {
            padding: {
              top: -30
            }
          },
          plugins: {
            legend: {
              position: 'top' as const,
              labels: {
                font: {
                  family: "'Roboto', sans-serif"
                }
              }
            },
            title: {
              display: true,
            },
          },
        }} data={{ labels, datasets: [dataset] }} />
      
    );
}

export default Graph;
