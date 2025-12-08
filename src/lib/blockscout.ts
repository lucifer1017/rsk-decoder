import { config } from './config';

export interface BlockscoutABIResponse {
  status: string;
  message: string;
  result: string; // JSON string of ABI array
}

/**
 * Fetch contract ABI from Blockscout Explorer
 */
export async function getContractABI(
  contractAddress: string,
  network: 'mainnet' | 'testnet' = config.defaultNetwork
): Promise<any[]> {
  const apiUrl = network === 'mainnet' ? config.blockscout.mainnet : config.blockscout.testnet;
  
  const url = `${apiUrl}?module=contract&action=getabi&address=${contractAddress}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ABI: ${response.statusText}`);
  }
  
  const data: BlockscoutABIResponse = await response.json();
  
  if (data.status === '0') {
    throw new Error(data.message || 'Contract ABI not found. Contract may not be verified.');
  }
  
  if (!data.result || data.result === 'Contract source code not verified') {
    throw new Error('Contract is not verified on the explorer');
  }
  
  try {
    const abi = JSON.parse(data.result);
    return abi;
  } catch (error) {
    throw new Error('Failed to parse ABI JSON');
  }
}


