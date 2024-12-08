'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { useCallback, useMemo, useState } from 'react';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID, MINT_ADDRESS, STATE_ADDRESS } from '@/constants';

// Import the IDL directly
import idl from '../idl/pump.json';

type ProgramType = Program<{
  version: string;
  name: string;
  instructions: any[];
  accounts: any[];
}>;

export const useProgram = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions,
      },
      { commitment: 'confirmed' }
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as any, PROGRAM_ID, provider) as ProgramType;
  }, [provider]);

  const buyTokens = useCallback(async (amount: number) => {
    if (!program || !publicKey || !MINT_ADDRESS || !STATE_ADDRESS) {
      console.error('Required addresses not initialized');
      return;
    }
    
    setLoading(true);
    try {
      const userTokenAccount = await getAssociatedTokenAddress(
        MINT_ADDRESS,
        publicKey
      );

      const tx = await program.methods
        .buyTokens(new BN(amount))
        .accounts({
          state: STATE_ADDRESS,
          user: publicKey,
          mint: MINT_ADDRESS,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      await connection.confirmTransaction(tx);
      console.log('Buy transaction successful:', tx);
    } catch (error) {
      console.error('Buy transaction failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, connection]);

  const sellTokens = useCallback(async (amount: number) => {
    if (!program || !publicKey || !MINT_ADDRESS || !STATE_ADDRESS) {
      console.error('Required addresses not initialized');
      return;
    }
    
    setLoading(true);
    try {
      const userTokenAccount = await getAssociatedTokenAddress(
        MINT_ADDRESS,
        publicKey
      );

      const tx = await program.methods
        .sellTokens(new BN(amount))
        .accounts({
          state: STATE_ADDRESS,
          user: publicKey,
          mint: MINT_ADDRESS,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      await connection.confirmTransaction(tx);
      console.log('Sell transaction successful:', tx);
    } catch (error) {
      console.error('Sell transaction failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, connection]);

  const getMarketStats = useCallback(async () => {
    if (!program || !STATE_ADDRESS) return {
      marketCap: 0,
      totalSupply: 0,
      circulatingSupply: 0,
      currentPrice: 0,
      graduated: false,
    };

    try {
      const stateAccount = await program.account.stateAccount.fetch(STATE_ADDRESS);
      return {
        marketCap: stateAccount.marketCap.toNumber(),
        totalSupply: stateAccount.totalSupply.toNumber(),
        circulatingSupply: stateAccount.circulatingSupply.toNumber(),
        currentPrice: stateAccount.marketCap.toNumber() / stateAccount.circulatingSupply.toNumber(),
        graduated: stateAccount.graduated,
      };
    } catch (error) {
      console.error('Failed to fetch market stats:', error);
      return {
        marketCap: 0,
        totalSupply: 0,
        circulatingSupply: 0,
        currentPrice: 0,
        graduated: false,
      };
    }
  }, [program]);

  const getPriceHistory = useCallback(async () => {
    if (!program || !STATE_ADDRESS) return [];

    try {
      const stateAccount = await program.account.stateAccount.fetch(STATE_ADDRESS);
      return stateAccount.priceHistory || [];
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      return [];
    }
  }, [program]);

  return {
    buyTokens,
    sellTokens,
    getMarketStats,
    getPriceHistory,
    loading,
  };
}; 