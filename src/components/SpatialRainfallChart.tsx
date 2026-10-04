import React from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title);

interface SpatialPoint {
  lat: number;
  lon: number;
  rainfall: number;
  date?: string;
}

interface Props {
  points: SpatialPoint[];
  title?: string;
}

export const SpatialRainfallChart: React.FC<Props> = ({ points, title = 'التوزيع المكاني للهطول' }) => {
  // Filter points with valid coordinates
  const validPoints = points.filter(p => p.lat !== 0 && p.lon !== 0 && p.rainfall > 0);

  if (validPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-300 text-[10px] space-y-2">
        <div className="w-12 h-12 rounded-full border border-dashed border-slate-200 flex items-center justify-center opacity-50">
          ?
        </div>
        <p>لا توجد إحداثيات جغرافية (Lat/Lon) في البيانات المرفوعة</p>
      </div>
    );
  }

  const data = {
    datasets: [
      {
        label: 'هطول الأمطار (مم)',
        data: validPoints.map((p) => ({
          x: p.lon,
          y: p.lat,
          r: Math.max(3, Math.min(20, p.rainfall / 2)), // Radius based on rainfall
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: 'Latitude (خط العرض)',
          font: { size: 10, weight: 'bold' }
        },
        ticks: { font: { size: 9 } }
      },
      x: {
        title: {
          display: true,
          text: 'Longitude (خط الطول)',
          font: { size: 10, weight: 'bold' }
        },
        ticks: { font: { size: 9 } }
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const p = validPoints[context.dataIndex];
            return `مطر: ${p.rainfall.toFixed(1)} مم | إحداثيات: ${p.lat.toFixed(3)}, ${p.lon.toFixed(3)}`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full">
      <Bubble data={data} options={options as any} />
    </div>
  );
};
