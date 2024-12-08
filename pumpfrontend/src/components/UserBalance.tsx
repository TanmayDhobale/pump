'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { MINT_ADDRESS } from '@/constants';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { formatNumber } from '@/utils/format';

export const UserBalance = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setBalance(0);
        setLoading(false);
        return;
      }

      try {
        const ata = await getAssociatedTokenAddress(
          new PublicKey(MINT_ADDRESS),
          publicKey
        );
        const tokenBalance = await connection.getTokenAccountBalance(ata);
        setBalance(Number(tokenBalance.value.uiAmount));
      } catch (err) {
        console.error('Error fetching balance:', err);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [connection, publicKey]);

  if (!publicKey) return null;
  if (loading) return <div>Loading balance...</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-2">Your Balance</h3>
      <p className="text-xl font-mono">{formatNumber(balance)} tokens</p>
    </div>
  );
}; 