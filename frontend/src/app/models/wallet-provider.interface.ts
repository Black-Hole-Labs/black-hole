export interface WalletProvider {
  connect(): Promise<{ address: string; network: string }>;
  switchNetwork(network: any): Promise<void>;
  getNetwork(): Promise<string>;
  getAddress(): string;
  isAvailable(): boolean;
}

export interface Network {
  id: number;
  name: string;
  rpcUrls: string;
  logoURI?: string;
  idHex?:string;
  chainType: string; // Network type (EVM, SVM)
  explorerUrl: string;
}

export interface TransactionRequestEVM {
  value: string; // in hex
  to: string; // address receiver
  data: string; // trx data(payload)
  chainId: number;
  gasPrice: string; // in hex
  gasLimit: string; // in hex
  from: string; // address sender
}

export interface TransactionRequestSVM {
  data: string; 
}

export interface Wallets {
  id: string;
  name: string;
  type: string;
  cssClass: string;
  installUrl?: string;
  iconUrl: string;
  status?: string;
}

export enum ProviderType {
  EVM = 'EVM',
  SVM = 'SVM',
  MULTICHAIN = 'multichain'
}

export enum NetworkId
{
  ETHEREUM_MAINNET = 1,
  SOLANA_MAINNET = 1151111081099710,
}