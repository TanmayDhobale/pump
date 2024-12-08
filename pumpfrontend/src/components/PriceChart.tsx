import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { useProgram } from '../hooks/useProgram';
import { PricePoint } from '../types/program';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const PriceChart = () => {
  const { program } = useProgram();
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!program) return;

    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        const stateAccount = await program.account.stateAccount.fetch(
          process.env.NEXT_PUBLIC_STATE_ADDRESS!
        );
        setPriceData(stateAccount.priceHistory);
      } catch (error) {
        console.error('Error fetching price history:', error);
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to price updates
    const subscribeToUpdates = () => {
      program.addEventListener('PriceUpdate', (event) => {
        setPriceData((prev) => [...prev, {
          timestamp: event.timestamp,
          price: event.price,
          volume: event.volume,
          marketCap: event.market_cap,
        }]);
      });
    };

    fetchPriceHistory();
    subscribeToUpdates();

    // Cleanup
    return () => {
      program.removeEventListener('PriceUpdate');
    };
  }, [program]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const chartData: ChartData<'line'> = {
    labels: priceData.map(p => 
      new Date(p.timestamp * 1000).toLocaleTimeString()
    ),
    datasets: [
      {
        label: 'Price (USD)',
        data: priceData.map(p => p.price),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        pointRadius: 2,
      },
      {
        label: 'Volume',
        data: priceData.map(p => p.volume),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.1,
        pointRadius: 2,
        hidden: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Price History',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 h-96">
      <Line data={chartData} options={options} />
    </div>
  );
}; 