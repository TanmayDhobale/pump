'use client';

import { useProgram } from '@/hooks/useProgram';
import { useEffect, useState } from 'react';
import { formatNumber } from '@/utils/format';
import { MarketStats as MarketStatsType } from '@/types/program';

const defaultStats: MarketStatsType = {
  marketCap: 0,
  totalSupply: 0,
  circulatingSupply: 0,
  currentPrice: 0,
  graduated: false,
  lpLocked: false,
};

export const MarketStats = () => {
  const { getMarketStats } = useProgram();
  const [stats, setStats] = useState<MarketStatsType>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const marketStats = await getMarketStats();
        if (marketStats) {
          setStats({
            marketCap: Number(marketStats.marketCap || 0),
            totalSupply: Number(marketStats.totalSupply || 0),
            circulatingSupply: Number(marketStats.circulatingSupply || 0),
            currentPrice: Number(marketStats.currentPrice || 0),
            graduated: Boolean(marketStats.graduated),
            lpLocked: Boolean(marketStats.lpLocked),
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching market stats:', err);
        setError('Failed to fetch market stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [getMarketStats]);

  if (loading) return <div className="text-center">Loading market stats...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Market Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p>Market Cap: {formatNumber(stats.marketCap)} SOL</p>
          <p>Total Supply: {formatNumber(stats.totalSupply)} tokens</p>
          <p>Circulating Supply: {formatNumber(stats.circulatingSupply)} tokens</p>
        </div>
        <div>
          <p>Current Price: {formatNumber(stats.currentPrice)} SOL</p>
          <p>Graduated: {stats.graduated ? 'Yes' : 'No'}</p>
          <p>LP Locked: {stats.lpLocked ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}; 