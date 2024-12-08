'use client';

import { useEffect, useState } from 'react';
import { useProgram } from '@/hooks/useProgram';
import { PriceChart } from './PriceChart';

interface MarketStatsType {
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  currentPrice: number;
  graduated: boolean;
}

export const MarketStats = () => {
  const { getMarketStats } = useProgram();
  const [stats, setStats] = useState<MarketStatsType>({
    marketCap: 0,
    totalSupply: 0,
    circulatingSupply: 0,
    currentPrice: 0,
    graduated: false,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const marketStats = await getMarketStats();
        setStats({
          marketCap: Number(marketStats.marketCap),
          totalSupply: Number(marketStats.totalSupply),
          circulatingSupply: Number(marketStats.circulatingSupply),
          currentPrice: Number(marketStats.currentPrice),
          graduated: Boolean(marketStats.graduated),
        });
      } catch (error) {
        console.error('Error fetching market stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [getMarketStats]);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
        <h2 className="text-2xl font-bold mb-6">Market Stats</h2>
        <div className="grid gap-4">
          <div className="flex justify-between">
            <span>Market Cap</span>
            <span className="font-mono">${stats.marketCap.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Price</span>
            <span className="font-mono">${stats.currentPrice.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span>Circulating Supply</span>
            <span className="font-mono">{stats.circulatingSupply.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Supply</span>
            <span className="font-mono">{stats.totalSupply.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span className={`font-mono ${stats.graduated ? 'text-green-500' : 'text-yellow-500'}`}>
              {stats.graduated ? 'Graduated' : 'Pre-graduation'}
            </span>
          </div>
        </div>
      </div>
      
      <PriceChart />
    </div>
  );
}; 