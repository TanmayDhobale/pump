export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
}

export enum TransactionType {
  Buy = 'Buy',
  Sell = 'Sell',
}

export interface PriceUpdate {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
  transactionType: TransactionType;
}

export interface Transaction {
  type: TransactionType | 'Unknown';
  amount: number;
  price: number;
  timestamp: number;
  address: string;
}

export interface MarketStats {
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  currentPrice: number;
  graduated: boolean;
} 