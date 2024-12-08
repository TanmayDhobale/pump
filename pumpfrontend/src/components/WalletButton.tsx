'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletButton = () => {
  const { connected } = useWallet();
  
  return (
    <WalletMultiButton className="wallet-button">
      {connected ? 'Connected' : 'Connect Wallet'}
    </WalletMultiButton>
  );
}; 