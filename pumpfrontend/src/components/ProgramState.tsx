'use client';

import { useProgram } from '@/hooks/useProgram';
import { useEffect, useState } from 'react';
import { STATE_ADDRESS } from '@/constants';
import { StateAccount } from '@/types/program';
import { formatNumber } from '@/utils/format';

export const ProgramState = () => {
  const { program, loading, error } = useProgram();
  const [state, setState] = useState<StateAccount | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      if (!program) return;
      try {
        const stateAccount = await program.account.stateAccount.fetch(STATE_ADDRESS);
        setState(stateAccount);
      } catch (err) {
        console.error('Error fetching state:', err);
      }
    };

    fetchState();
    // Set up interval for real-time updates
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [program]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!state) return <div>No state available</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Program State</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Market Info</h3>
          <div className="space-y-2">
            <p>Market Cap: {formatNumber(state.marketCap)} SOL</p>
            <p>Total Supply: {formatNumber(state.totalSupply)} tokens</p>
            <p>Circulating Supply: {formatNumber(state.circulatingSupply)} tokens</p>
            <p>Current Price: {formatNumber(state.currentPrice)} SOL</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Status</h3>
          <div className="space-y-2">
            <p>Graduated: {state.graduated ? 'Yes' : 'No'}</p>
            <p>LP Locked: {state.lpLocked ? 'Yes' : 'No'}</p>
            <p>Fee Percentage: {state.feePercentage / 100}%</p>
            <p>Last Update: {new Date(state.lastUpdate.toNumber() * 1000).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 