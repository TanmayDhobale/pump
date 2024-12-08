'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-purple-900">
      <nav className="p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pump.Fun</h1>
        <WalletMultiButton />
      </nav>

      <Dashboard />
    </main>
  );
}
