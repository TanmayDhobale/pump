import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '@/hooks/useProgram';
import { Transaction } from '@/types/program';
import { Skeleton } from './Skeleton';

export const TransactionHistory = () => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!program || !publicKey) return;

    const subscribeToTransactions = () => {
      program.addEventListener('TokensPurchased', (event) => {
        setTransactions(prev => [{
          type: 'Buy',
          amount: event.amount.toNumber(),
          price: event.price.toNumber(),
          timestamp: Date.now(),
          address: publicKey.toString()
        }, ...prev].slice(0, 10));
      });
    };

    const fetchTransactionHistory = async () => {
      try {
        setLoading(true);
        // Fetch transaction history from program logs
        const signatures = await program.provider.connection.getSignaturesForAddress(
          publicKey,
          { limit: 10 }
        );
        
        const txs = await Promise.all(
          signatures.map(async (sig) => {
            const tx = await program.provider.connection.getParsedTransaction(sig.signature);
            // Parse transaction data and return formatted transaction
            return {
              type: 'Unknown',
              amount: 0,
              price: 0,
              timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
              address: publicKey.toString()
            };
          })
        );
        
        setTransactions(txs);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
    subscribeToTransactions();

    return () => {
      program.removeEventListener('TokensPurchased');
    };
  }, [program, publicKey]);

  if (loading) return <Skeleton />;

  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
      <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center text-gray-400">No transactions yet</div>
        ) : (
          transactions.map((tx, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className={tx.type === 'Buy' ? 'text-green-500' : 'text-red-500'}>
                  {tx.type}
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span>{tx.amount.toLocaleString()} PUMP</span>
                <span className="text-sm text-gray-400">
                  ${tx.price.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 