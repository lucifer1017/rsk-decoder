import { ethers } from 'ethers';
import { config } from './config';

export interface TransactionData {
  input: string;
  blockNumber: string;
  from: string;
  to: string | null;
  hash: string;
}

export interface TransactionReceipt {
  contractAddress: string | null;
  status: string;
  transactionHash: string;
}

/**
 * Get transaction data by hash
 */
export async function getTransactionByHash(
  txHash: string,
  network: 'mainnet' | 'testnet' = config.defaultNetwork
): Promise<TransactionData> {
  const rpcUrl = network === 'mainnet' ? config.rpc.mainnet : config.rpc.testnet;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const tx = await provider.getTransaction(txHash);
  
  if (!tx) {
    throw new Error('Transaction not found');
  }
  
  if (tx.to !== null) {
    throw new Error('Transaction is not a contract creation (to field is not null)');
  }
  
  return {
    input: tx.data,
    blockNumber: tx.blockNumber?.toString() || '0',
    from: tx.from,
    to: tx.to,
    hash: tx.hash,
  };
}

/**
 * Get transaction receipt by hash
 */
export async function getTransactionReceipt(
  txHash: string,
  network: 'mainnet' | 'testnet' = config.defaultNetwork
): Promise<TransactionReceipt> {
  const rpcUrl = network === 'mainnet' ? config.rpc.mainnet : config.rpc.testnet;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }
  
  if (!receipt.contractAddress) {
    throw new Error('Transaction did not create a contract');
  }
  
  return {
    contractAddress: receipt.contractAddress,
    status: receipt.status === 1 ? '0x1' : '0x0',
    transactionHash: receipt.hash,
  };
}


