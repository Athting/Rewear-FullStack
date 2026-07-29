import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ChartContainer({
  type = 'bar',
  labels = [],
  datasets = [],
  title = ''
}) {
  const data = {
    labels,
    datasets: datasets.map((set) => ({
      label: set.label,
      data: set.data,
      backgroundColor: set.backgroundColor || 'rgba(46, 125, 50, 0.5)',
      borderColor: set.borderColor || 'rgba(46, 125, 50, 1)',
      borderWidth: 2,
      fill: set.fill || false,
      tension: 0.3, // smooth line curve
      borderRadius: type === 'bar' ? 6 : 0 // rounded bar corners
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Poppins, sans-serif'
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: 'Poppins, sans-serif',
          size: 14,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Inter, sans-serif'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            family: 'Inter, sans-serif'
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: '240px', width: '100%' }}>
      {type === 'bar' ? (
        <Bar data={data} options={options} />
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
}
