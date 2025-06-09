import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors,
);

const Graph: React.FC<{
  format: (item: { label: string; raw: number }) => string;
  tableName: string;
  labels: string[];
  dataset: { label: string; data: number[]; backgroundColor?: string[] };
}> = ({ format, tableName, labels, dataset }) => {
  // for customizing chartjs since tailwind can't
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  ChartJS.defaults.color = isDark ? "white" : "black";
  const defaultOptions = {
    responsive: true,
    interaction: {
      intersect: true,
      mode: "index",
    },
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: {
            family: "'Roboto', sans-serif",
          },
        },
      },
      title: {
        align: "start",
        fullSize: false,
        display: true,
        text: "  " + tableName,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: format,
        },
      },
    },
  } as React.ComponentProps<typeof Pie>["options"];

  return (
    <Pie
      className="bg-white dark:bg-gray-800 shadow-lg"
      options={defaultOptions}
      data={{ labels, datasets: [dataset] }}
    />
  );
};

export default Graph;
