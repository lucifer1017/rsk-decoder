import { config } from './config';

export interface BlockscoutABIResponse {
  status: string;
  message: string;
  result: string; // JSON string of ABI array
}

export interface BlockscoutSourceCodeResult {
  SourceCode?: string;
  ABI?: string;
  ContractName?: string;
  CompilerVersion?: string;
  OptimizationUsed?: string;
  Runs?: string;
  ConstructorArguments?: string;
  EVMVersion?: string;
  Library?: string;
  LicenseType?: string;
  Proxy?: string;
  Implementation?: string;
  SwarmSource?: string;
  Bytecode?: string;
  CreationBytecode?: string;
}

export interface BlockscoutSourceCodeResponse {
  status: string;
  message: string;
  result: BlockscoutSourceCodeResult[];
}

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

export async function getCreationBytecode(
  contractAddress: string,
  network: 'mainnet' | 'testnet' = config.defaultNetwork
): Promise<string | null> {
  try {
    const apiUrl = network === 'mainnet' ? config.blockscout.mainnet : config.blockscout.testnet;
    const url = `${apiUrl}?module=contract&action=getsourcecode&address=${contractAddress}`;
    const response = await fetch(url);
    const data: BlockscoutSourceCodeResponse = await response.json();

    if (data.status === '0' || !data.result || data.result.length === 0) {
      return null;
    }

    const entry = data.result[0];
    // Prefer explicit CreationBytecode if present, otherwise Bytecode
    const creation = entry.CreationBytecode || entry.Bytecode;
    if (creation && creation !== '0x') {
      return creation;
    }
  } catch (error) {
    console.error('Failed to fetch creation bytecode via Blockscout:', error);
  }

  return null;
}


