'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { useCallback, useMemo, useState } from 'react';
import { PROGRAM_ID, STATE_ADDRESS, MINT_ADDRESS } from '@/constants';
import { IDL, PumpIdl } from '@/types/idl';
import { StateAccount, MarketStats, TradingStats } from '@/types/program';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program<PumpIdl>(IDL, PROGRAM_ID, provider);
  }, [provider]);

  const getMarketStats = useCallback(async (): Promise<MarketStats | null> => {
    if (!program) return null;
    try {
      const state = await program.account.stateAccount.fetch(STATE_ADDRESS);
      return {
        marketCap: state.marketCap.toNumber(),
        totalSupply: state.totalSupply.toNumber(),
        circulatingSupply: state.circulatingSupply.toNumber(),
        currentPrice: state.currentPrice.toNumber(),
        graduated: state.graduated,
        lpLocked: state.lpLocked,
      };
    } catch (err) {
      console.error('Error fetching market stats:', err);
      return null;
    }
  }, [program]);

  const buyTokens = useCallback(async (amount: number): Promise<TradingStats> => {
    setLoading(true);
    setError(null);
    try {
      if (!program || !wallet.publicKey) {
        throw new Error('Program or wallet not initialized');
      }

      const userAta = await getAssociatedTokenAddress(
        new PublicKey(MINT_ADDRESS),
        wallet.publicKey
      );

      const tx = await program.methods
        .buyTokens(new BN(amount))
        .accounts({
          state: STATE_ADDRESS,
          user: wallet.publicKey,
          mint: MINT_ADDRESS,
          userTokenAccount: userAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      return { loading: false, error: null, success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { loading: false, error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  const sellTokens = useCallback(async (amount: number): Promise<TradingStats> => {
    setLoading(true);
    setError(null);
    try {
      if (!program || !wallet.publicKey) {
        throw new Error('Program or wallet not initialized');
      }

      const userAta = await getAssociatedTokenAddress(
        new PublicKey(MINT_ADDRESS),
        wallet.publicKey
      );

      const tx = await program.methods
        .sellTokens(new BN(amount))
        .accounts({
          state: STATE_ADDRESS,
          user: wallet.publicKey,
          mint: MINT_ADDRESS,
          userTokenAccount: userAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      return { loading: false, error: null, success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { loading: false, error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  return {
    program,
    provider,
    loading,
    error,
    getMarketStats,
    buyTokens,
    sellTokens,
  };
}; 