import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { MINT_ADDRESS } from '@/constants';
import { Skeleton } from './Skeleton';

export const TokenBalance = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      
      try {
        setLoading(true);
        const ata = await getAssociatedTokenAddress(MINT_ADDRESS, publicKey);
        const balance = await connection.getTokenAccountBalance(ata);
        setBalance(Number(balance.value.uiAmount));
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
      <h2 className="text-xl font-bold mb-2">Your Balance</h2>
      <div className="text-3xl font-mono">
        {balance?.toLocaleString()} PUMP
      </div>
    </div>
  );
}; 