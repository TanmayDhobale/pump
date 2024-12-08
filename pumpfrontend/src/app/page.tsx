'use client';

import { WalletButton } from '@/components/WalletButton';
import { ProgramState } from '@/components/ProgramState';
import { MarketStats } from '@/components/MarketStats';
import { TradingInterface } from '@/components/TradingInterface';
import { PriceChart } from '@/components/PriceChart';
import { UserBalance } from '@/components/UserBalance';
import { WalletContextProvider } from '@/components/WalletContextProvider';

export default function Home() {
  return (
    <WalletContextProvider>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white">
        <nav className="p-6 flex justify-between items-center backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Pump.Fun
            </h1>
            <span className="px-2 py-1 text-xs bg-purple-500/20 rounded-full">Devnet</span>
          </div>
          <div className="flex items-center gap-4">
            <UserBalance />
            <WalletButton />
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <ProgramState />
            <MarketStats />
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl">
            <PriceChart />
          </div>
          <div className="max-w-md mx-auto">
            <TradingInterface />
          </div>
          <footer className="text-center text-gray-400 text-sm mt-12">
            <p>Trading tokens involves risk. Please trade responsibly.</p>
          </footer>
        </div>
      </main>
    </WalletContextProvider>
  );
}
