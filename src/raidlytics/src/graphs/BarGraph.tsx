import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
);

function isObject(item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === "object" && !Array.isArray(item);
}

function deepMerge<T>(target: T, ...sources: T[]) {
  if (!sources?.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return deepMerge(target, ...sources);
}

const Graph: React.FC<{
  labels: string[];
  dataset: { label: string; data: number[]; backgroundColor: string };
  extendedOptions?: React.ComponentProps<typeof Bar>["options"];
}> = ({ labels, dataset, extendedOptions }) => {
  // for customizing chartjs since tailwind can't
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  ChartJS.defaults.color = isDark ? "white" : "black";
  const defaultOptions = {
    responsive: true,
    interaction: {
      intersect: false,
      mode: "index",
    },
    layout: {
      padding: {
        top: -30,
        left: 10,
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "'Roboto', sans-serif",
          },
        },
      },
      title: {
        display: true,
      },
    },
  } as React.ComponentProps<typeof Bar>["options"];

  return (
    <Bar
      className="bg-white dark:bg-gray-800 shadow-lg"
      options={deepMerge(defaultOptions, extendedOptions)}
      data={{ labels, datasets: [dataset] }}
    />
  );
};

export default Graph;
