'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ProgramState } from '@/components/ProgramState';
import { MarketStats } from '@/components/MarketStats';
import { TradingInterface } from '@/components/TradingInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <nav className="p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pump.Fun</h1>
        <WalletMultiButton />
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <ProgramState />
        <MarketStats />
        <TradingInterface />
      </div>
    </main>
  );
}
