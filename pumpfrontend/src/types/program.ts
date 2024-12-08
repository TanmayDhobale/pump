import { BN } from '@project-serum/anchor';

export interface StateAccount {
  authority: string;
  feeWallet: string;
  totalSupply: BN;
  circulatingSupply: BN;
  marketCap: BN;
  graduated: boolean;
  lpLocked: boolean;
  timestamp: BN;
  lpSupply: BN;
  initialPrice: BN;
  currentPrice: BN;
  graduationThreshold: BN;
  feePercentage: number;
  lastUpdate: BN;
}

export interface MarketStats {
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  currentPrice: number;
  graduated: boolean;
  lpLocked: boolean;
}

export interface TradingStats {
  loading: boolean;
  error: string | null;
  success: boolean;
} 