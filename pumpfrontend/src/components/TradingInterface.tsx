'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '@/hooks/useProgram';
import { formatNumber } from '@/utils/format';

export const TradingInterface = () => {
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const { connected } = useWallet();
  const { buyTokens, sellTokens, loading, error, getMarketStats } = useProgram();
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const handleAmountChange = async (value: string) => {
    setAmount(value);
    if (!value || isNaN(Number(value))) {
      setEstimatedCost(null);
      return;
    }

    const stats = await getMarketStats();
    if (stats) {
      const cost = Number(value) * stats.currentPrice;
      setEstimatedCost(cost);
    }
  };

  const handleTrade = async () => {
    if (!amount || loading || !connected) return;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount)) return;

    if (isBuying) {
      await buyTokens(parsedAmount);
    } else {
      await sellTokens(parsedAmount);
    }

    setAmount('');
    setEstimatedCost(null);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex gap-2 mb-4">
        <button
          className={`flex-1 py-2 px-4 rounded ${
            isBuying ? 'bg-green-500' : 'bg-gray-600'
          }`}
          onClick={() => setIsBuying(true)}
        >
          Buy
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded ${
            !isBuying ? 'bg-red-500' : 'bg-gray-600'
          }`}
          onClick={() => setIsBuying(false)}
        >
          Sell
        </button>
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => handleAmountChange(e.target.value)}
        placeholder="Enter amount"
        className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
      />

      {estimatedCost !== null && (
        <div className="mb-4 text-sm">
          Estimated {isBuying ? 'Cost' : 'Return'}: {formatNumber(estimatedCost)} SOL
        </div>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <button
        onClick={handleTrade}
        disabled={!connected || loading || !amount}
        className={`w-full py-2 px-4 rounded ${
          !connected || loading
            ? 'bg-gray-600'
            : isBuying
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {loading ? 'Processing...' : connected ? `${isBuying ? 'Buy' : 'Sell'} Tokens` : 'Connect Wallet'}
      </button>
    </div>
  );
}; 