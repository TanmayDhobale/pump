'use client';

import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const WalletButton = () => {
  return <WalletMultiButtonDynamic className="wallet-adapter-button" />;
}; 