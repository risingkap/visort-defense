import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LinearScale, Title, CategoryScale, Tooltip, Legend, ArcElement } from 'chart.js';
import { ChartBarIcon, ChartPieIcon } from '@heroicons/react/24/outline';

ChartJS.register(BarElement, LinearScale, Title, CategoryScale, Tooltip, Legend, ArcElement);

// Supports both single-series (legacy props) and multi-series via labels + series array
function WasteCategoryCard({ category, color, data, labels, series, indexAxis = 'x', chartType = 'bar', chartRef }) {
  const isMulti = Array.isArray(series) && Array.isArray(labels);
  const chartData = (() => {
    if (chartType === 'pie') {
      // Expect multi series: collapse into one dataset with multiple slices
      const pieLabels = labels || series?.map(s => s.label) || [];
      const pieData = series ? series.map(s => (Array.isArray(s.data) ? s.data[0] ?? 0 : 0)) : [];
      const pieColors = series ? series.map(s => s.color?.bg || 'rgba(59,130,246,0.7)') : [];
      const pieBorders = series ? series.map(s => s.color?.border || 'rgba(37,99,235,1)') : [];
      return {
        labels: pieLabels,
        datasets: [
          {
            label: 'Disposals',
            data: pieData,
            backgroundColor: pieColors,
            borderColor: pieBorders,
            borderWidth: 1,
          },
        ],
      };
    }
    if (isMulti) {
      return {
        labels,
        datasets: series.map((s) => ({
          label: s.label,
          data: s.data,
          backgroundColor: s.color?.bg || 'rgba(59,130,246,0.7)',
          borderColor: s.color?.border || 'rgba(37,99,235,1)',
          borderWidth: 1,
          barThickness: 'flex',
          maxBarThickness: 28,
          categoryPercentage: 0.6,
          barPercentage: 0.9,
        })),
      };
    }
    return {
      labels: data.map((item) => item.month),
      datasets: [
        {
          label: 'Disposals',
          data: data.map((item) => item.value),
          backgroundColor: color === 'red' ? 'rgba(220, 38, 38, 0.7)' : 'rgba(34, 197, 94, 0.7)',
          borderColor: color === 'red' ? 'rgba(185, 28, 28, 1)' : 'rgba(21, 128, 61, 1)',
          borderWidth: 1,
          barThickness: 'flex',
          maxBarThickness: 28,
          categoryPercentage: 0.6,
          barPercentage: 0.9,
        },
      ],
    };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    plugins: {
      title: { 
        display: false 
      },
      legend: { 
        position: 'bottom', 
        labels: { 
          font: { 
            size: 10,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
        },
        align: 'center',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 8,
        titleFont: {
          size: 11,
          weight: 'bold',
        },
        bodyFont: {
          size: 10,
        },
      },
    },
    indexAxis,
    scales: {
      x: indexAxis === 'y'
        ? {
            type: 'linear',
            title: { 
              display: true, 
              text: 'Total Disposals', 
              font: { 
                size: 10,
                family: 'Inter, system-ui, sans-serif',
                weight: '500',
              },
              color: '#6B7280',
            },
            beginAtZero: true,
            grid: { 
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 9,
                family: 'Inter, system-ui, sans-serif',
              },
              color: '#6B7280',
            },
          }
        : {
            type: 'category',
            title: { display: false },
            grid: { display: false },
            offset: true,
            ticks: { 
              align: 'center',
              font: {
                size: 11,
                family: 'Inter, system-ui, sans-serif',
              },
              color: '#6B7280',
            },
          },
      y: indexAxis === 'y'
        ? {
            type: 'category',
            title: { display: false },
            grid: { display: false },
            ticks: {
              font: {
                size: 9,
                family: 'Inter, system-ui, sans-serif',
              },
              color: '#6B7280',
            },
          }
        : {
            type: 'linear',
            title: { 
              display: true, 
              text: 'Total Disposals', 
              font: { 
                size: 10,
                family: 'Inter, system-ui, sans-serif',
                weight: '500',
              },
              color: '#6B7280',
            },
            beginAtZero: true,
            grace: '30%',
            grid: { 
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 9,
                family: 'Inter, system-ui, sans-serif',
              },
              color: '#6B7280',
            },
          },
    },
    interaction: { 
      mode: 'nearest', 
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  // Define card styles with compact design
  const cardStyle = {
    borderColor: color || '#e5e7eb',
    height: '500px',
  };

  // Get chart icon based on chart type
  const ChartIcon = chartType === 'pie' ? ChartPieIcon : ChartBarIcon;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={cardStyle}>
      {/* Compact Header with Icon */}
      <div className="flex items-center space-x-2 mb-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-md ${
          color === 'red' 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-green-500 to-green-600'
        }`}>
          <ChartIcon className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{category}</h3>
      </div>
      
      {/* Compact Chart Container */}
      <div className="chart-container w-full h-full bg-gradient-to-br from-gray-50 to-white rounded-lg p-2 border border-gray-100">
        {chartType === 'pie' ? (
          <Pie ref={chartRef} data={chartData} options={chartOptions} />
        ) : (
          <Bar ref={chartRef} data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

export default WasteCategoryCard;