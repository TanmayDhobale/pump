'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '@/hooks/useProgram';

export const TradingInterface = () => {
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const { connected } = useWallet();
  const { buyTokens, sellTokens, loading } = useProgram();

  const handleTrade = async () => {
    if (!amount || loading || !connected) return;

    try {
      if (isBuying) {
        await buyTokens(parseFloat(amount));
      } else {
        await sellTokens(parseFloat(amount));
      }
      setAmount('');
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
      <div className="flex gap-4 mb-6">
        <button
          className={`flex-1 py-2 rounded-lg ${
            isBuying ? 'bg-purple-600' : 'bg-transparent border border-purple-600'
          }`}
          onClick={() => setIsBuying(true)}
        >
          Buy
        </button>
        <button
          className={`flex-1 py-2 rounded-lg ${
            !isBuying ? 'bg-purple-600' : 'bg-transparent border border-purple-600'
          }`}
          onClick={() => setIsBuying(false)}
        >
          Sell
        </button>
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 mb-4"
      />

      <button
        onClick={handleTrade}
        disabled={!connected || !amount || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg"
      >
        {loading ? 'Processing...' : isBuying ? 'Buy Tokens' : 'Sell Tokens'}
      </button>
    </div>
  );
}; 