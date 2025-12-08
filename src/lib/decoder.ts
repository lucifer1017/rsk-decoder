import { ethers } from 'ethers';
import { config } from './config';

export interface DecodedParameter {
  name: string;
  type: string;
  value: any;
  formattedValue: string;
}

export interface DecodedConstructor {
  parameters: DecodedParameter[];
}

/**
 * Extract constructor arguments from transaction input
 * Transaction input = bytecode + encoded constructor arguments
 */
export function extractConstructorArgs(
  txInput: string,
  contractBytecode: string
): string {
  // Remove 0x prefix if present
  const input = txInput.startsWith('0x') ? txInput.slice(2) : txInput;
  const bytecode = contractBytecode.startsWith('0x') ? contractBytecode.slice(2) : contractBytecode;
  
  // Validate that txInput is longer than or equal to bytecode
  if (input.length < bytecode.length) {
    throw new Error('Transaction input is shorter than contract bytecode. This should not happen.');
  }
  
  // Constructor args are everything after the bytecode
  const constructorArgs = input.slice(bytecode.length);
  
  return '0x' + constructorArgs;
}

/**
 * Get bytecode from Blockscout API or calculate from transaction input
 * For now, we'll try to get it from the explorer, but if not available,
 * we can estimate by finding the constructor args start
 */
export async function getContractBytecode(
  contractAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<string | null> {
  // 1) Try direct RPC (most reliable)
  try {
    const rpcUrl = network === 'mainnet' ? config.rpc.mainnet : config.rpc.testnet;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const code = await provider.getCode(contractAddress);
    if (code && code !== '0x') {
      return code;
    }
  } catch (error) {
    console.error('Failed to fetch bytecode via RPC:', error);
  }

  // 2) Fallback: Blockscout proxy
  try {
    const apiUrl = network === 'mainnet'
      ? config.blockscout.mainnet
      : config.blockscout.testnet;

    const url = `${apiUrl}?module=proxy&action=eth_getCode&address=${contractAddress}&tag=latest`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.result && data.result !== '0x') {
      return data.result;
    }
  } catch (error) {
    console.error('Failed to fetch bytecode via Blockscout:', error);
  }
  
  return null;
}

/**
 * Decode constructor arguments using ABI
 */
export function decodeConstructorArgs(
  abi: any[],
  encodedArgs: string
): DecodedConstructor {
  // Find constructor in ABI
  const constructor = abi.find(item => item.type === 'constructor');
  
  if (!constructor) {
    throw new Error('No constructor found in ABI');
  }
  
  if (!constructor.inputs || constructor.inputs.length === 0) {
    return { parameters: [] };
  }
  
  // Create interface from ABI
  const iface = new ethers.Interface(abi);
  
  // For constructors, we use AbiCoder to decode directly
  // Constructors don't have function selectors, so the encoded args are directly ABI-encoded
  const abiCoder = new ethers.AbiCoder();
  
  try {
    // Get the input types
    const inputTypes = constructor.inputs.map((input: any) => input.type);
    
    // Decode the arguments
    const decoded = abiCoder.decode(inputTypes, encodedArgs);
    
    // Format the decoded values
    const parameters: DecodedParameter[] = constructor.inputs.map((input: any, index: number) => {
      const value = decoded[index];
      return {
        name: input.name || `param${index}`,
        type: input.type,
        value: value,
        formattedValue: formatValue(value, input.type),
      };
    });
    
    return { parameters };
  } catch (error) {
    throw new Error(`Failed to decode constructor arguments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format decoded value for display
 */
function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  // Handle BigNumber
  if (ethers.isAddress(value)) {
    return value;
  }
  
  if (typeof value === 'bigint' || (typeof value === 'object' && value._hex)) {
    return value.toString();
  }
  
  if (Array.isArray(value)) {
    return `[${value.map(v => formatValue(v, '')).join(', ')}]`;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}

/**
 * Main decoder function that extracts bytecode and decodes constructor args
 * Strategy: Get deployed bytecode from contract, which matches the bytecode in tx input
 */
export async function decodeConstructorFromTx(
  txInput: string,
  abi: any[],
  contractAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<DecodedConstructor> {
  // Get the deployed bytecode (this is what was in the transaction input, minus constructor args)
  const deployedBytecode = await getContractBytecode(contractAddress, network);
  
  if (!deployedBytecode) {
    throw new Error('Unable to fetch contract bytecode. Please ensure the contract is deployed and accessible.');
  }
  
  // The transaction input contains: deployment_bytecode + constructor_args
  // The deployed bytecode is what's stored on-chain (same as deployment_bytecode for standard contracts)
  // So constructor args = txInput - deployedBytecode
  const constructorArgs = extractConstructorArgs(txInput, deployedBytecode);
  
  // Validate that we extracted something reasonable
  if (constructorArgs === '0x' || constructorArgs.length <= 2) {
    // Check if constructor actually has parameters
    const constructor = abi.find(item => item.type === 'constructor');
    if (constructor && constructor.inputs && constructor.inputs.length > 0) {
      throw new Error('Constructor has parameters but no encoded data found. This may indicate the bytecode extraction failed.');
    }
    // No constructor arguments
    return { parameters: [] };
  }
  
  // Decode the arguments
  return decodeConstructorArgs(abi, constructorArgs);
}

