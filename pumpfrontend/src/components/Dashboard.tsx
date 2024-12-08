'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { MarketStats } from './MarketStats';
import { TradingInterface } from './TradingInterface';
import { TokenBalance } from './TokenBalance';
import { TransactionHistory } from './TransactionHistory';

export const Dashboard = () => {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="text-center p-6">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
        <p className="text-gray-400">Connect your wallet to start trading</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <TokenBalance />
          <TradingInterface />
        </div>
        <MarketStats />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionHistory />
      </div>
    </div>
  );
}; 
