'use client';

import { useEffect, useState, useRef } from 'react';
import { useProgram } from '@/hooks/useProgram';
import { Line } from 'react-chartjs-2';
import { STATE_ADDRESS } from '@/constants';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

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

interface PricePoint {
  timestamp: number;
  price: number;
}

export const PriceChart = () => {
  const { program } = useProgram();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const listenerKey = useRef<string | null>(null);

  useEffect(() => {
    if (!program) return;

    const generateInitialData = async () => {
      try {
        const state = await program.account.stateAccount.fetch(STATE_ADDRESS);
        const currentPrice = state.currentPrice.toNumber();
        const now = Math.floor(Date.now() / 1000);
        
        // Generate some mock historical data for visualization
        const initialData = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (20 - i) * 300, // 5 minutes intervals
          price: currentPrice * (0.95 + Math.random() * 0.1) // Random variation around current price
        }));
        
        // Add current price
        initialData.push({
          timestamp: now,
          price: currentPrice
        });
        
        setPriceHistory(initialData);
      } catch (error) {
        console.error('Error fetching initial price:', error);
      }
    };

    generateInitialData();

    const handlePriceUpdate = (event: any) => {
      setPriceHistory(prev => [...prev, {
        timestamp: event.timestamp.toNumber(),
        price: event.price.toNumber()
      }].slice(-50)); // Keep last 50 points
    };

    const setupListener = async () => {
      try {
        listenerKey.current = program.addEventListener('PriceUpdate', handlePriceUpdate);
      } catch (error) {
        console.error('Error setting up price listener:', error);
      }
    };

    setupListener();

    return () => {
      if (program && listenerKey.current) {
        program.removeEventListener(listenerKey.current);
      }
    };
  }, [program]);

  const chartData = {
    labels: priceHistory.map(p => new Date(p.timestamp * 1000).toLocaleTimeString()),
    datasets: [
      {
        label: 'Token Price',
        data: priceHistory.map(p => p.price),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(255, 255, 255)',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Token Price History',
        color: 'rgb(255, 255, 255)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgb(255, 255, 255)',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgb(255, 255, 255)',
          callback: (value: number) => `${value.toFixed(6)} SOL`
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}; 