import { ethers } from 'ethers';
import { config } from './config';
import { getCreationBytecode } from './blockscout';

export interface DecodedParameter {
  name: string;
  type: string;
  value: any;
  formattedValue: string;
}

export interface DecodedConstructor {
  parameters: DecodedParameter[];
}

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

export function bruteForceConstructorArgs(
  txInput: string,
  abi: any[]
): DecodedConstructor | null {
  const constructor = abi.find(item => item.type === 'constructor');
  if (!constructor) return { parameters: [] };
  if (!constructor.inputs || constructor.inputs.length === 0) return { parameters: [] };

  const abiCoder = new ethers.AbiCoder();
  const inputHex = txInput.startsWith('0x') ? txInput.slice(2) : txInput;
  const inputLen = inputHex.length;

  // Minimum length needed: 32 * (#inputs) (bytes encoded in hex -> *2 chars)
  const minChars = constructor.inputs.length * 64;
  if (inputLen < minChars) return null;

  // Heuristic offsets to try (chars, aligned to 32-byte words)
  const offsets = new Set<number>();
  // Try last 4096 chars region
  for (let off = Math.max(0, inputLen - 4096); off <= inputLen - minChars; off += 64) {
    offsets.add(off);
  }
  // Also try every 64 chars across the whole input but cap attempts
  const maxAttempts = 120;
  let attempts = 0;

  for (const off of offsets) {
    if (attempts >= maxAttempts) break;
    attempts += 1;
    const slice = '0x' + inputHex.slice(off);
    try {
      const decoded = abiCoder.decode(constructor.inputs as any, slice);
      const parameters: DecodedParameter[] = constructor.inputs.map((input: any, index: number) => {
        const value = decoded[index];
        return {
          name: input.name || `param${index}`,
          type: input.type,
          value: normalizeValueForJson(value),
          formattedValue: formatValue(value, input.type),
        };
      });
      return { parameters };
    } catch {
      // continue
    }
  }

  return null;
}

export async function getContractBytecode(
  contractAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<{ creationBytecode: string | null; runtimeBytecode: string | null }> {
  let creationBytecode: string | null = null;
  let runtimeBytecode: string | null = null;

  // Prefer creation bytecode from Blockscout (includes full deployment bytecode)
  creationBytecode = await getCreationBytecode(contractAddress, network);

  // Runtime bytecode via RPC (fallback for verification and sanity)
  try {
    const rpcUrl = network === 'mainnet' ? config.rpc.mainnet : config.rpc.testnet;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const code = await provider.getCode(contractAddress);
    if (code && code !== '0x') {
      runtimeBytecode = code;
    }
  } catch (error) {
    console.error('Failed to fetch bytecode via RPC:', error);
  }

  // Fallback: Blockscout proxy for runtime
  if (!runtimeBytecode) {
    try {
      const apiUrl = network === 'mainnet'
        ? config.blockscout.mainnet
        : config.blockscout.testnet;

      const url = `${apiUrl}?module=proxy&action=eth_getCode&address=${contractAddress}&tag=latest`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result !== '0x') {
        runtimeBytecode = data.result;
      }
    } catch (error) {
      console.error('Failed to fetch bytecode via Blockscout:', error);
    }
  }
  
  return { creationBytecode, runtimeBytecode };
}

export function decodeConstructorArgs(
  abi: any[],
  encodedArgs: string
): DecodedConstructor {
  // Find constructor in ABI
  const constructor = abi.find(item => item.type === 'constructor');
  
  // If no constructor entry, treat as zero-arg constructor
  if (!constructor) {
    return { parameters: [] };
  }
  
  if (!constructor.inputs || constructor.inputs.length === 0) {
    return { parameters: [] };
  }
  
  // For constructors, we use AbiCoder to decode directly
  // Constructors don't have function selectors, so the encoded args are directly ABI-encoded
  const abiCoder = new ethers.AbiCoder();
  
  try {
    // Decode the arguments
    // Pass full input definitions (handles tuples) to AbiCoder
    const decoded = abiCoder.decode(constructor.inputs as any, encodedArgs);
    
    // Format the decoded values
    const parameters: DecodedParameter[] = constructor.inputs.map((input: any, index: number) => {
      const value = decoded[index];
      return {
        name: input.name || `param${index}`,
        type: input.type,
        value: normalizeValueForJson(value),
        formattedValue: formatValue(value, input.type),
      };
    });
    
    return { parameters };
  } catch (error) {
    throw new Error(`Failed to decode constructor arguments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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

function normalizeValueForJson(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value === 'bigint') return value.toString();

  // ethers v6 may return native BigInt or other objects; handle _hex too
  if (typeof value === 'object' && value !== null) {
    if ('_hex' in value) {
      try {
        return BigInt((value as any)._hex).toString();
      } catch {
        return String((value as any)._hex);
      }
    }
    if (Array.isArray(value)) {
      return value.map((v) => normalizeValueForJson(v));
    }
    // For structs/tuples, convert each field
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = normalizeValueForJson(v);
    }
    return out;
  }

  return value;
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
  // Fetch creation bytecode (preferred) and runtime bytecode (fallback)
  const { creationBytecode, runtimeBytecode } = await getContractBytecode(contractAddress, network);

  // Choose bytecode for slicing (prefer creation bytecode)
  const bytecodeForSlicing = creationBytecode || runtimeBytecode;

  if (!bytecodeForSlicing) {
    throw new Error('Unable to fetch contract bytecode. Please ensure the contract is deployed, accessible, and verified.');
  }

  // Extract constructor arguments
  const constructorArgs = extractConstructorArgs(txInput, bytecodeForSlicing);

  // Validate that we extracted something reasonable
  if (constructorArgs === '0x' || constructorArgs.length <= 2) {
    // Check if constructor actually has parameters
    const constructor = abi.find(item => item.type === 'constructor');
    if (constructor && constructor.inputs && constructor.inputs.length > 0) {
      throw new Error('Constructor has parameters but no encoded data found. This may indicate the bytecode extraction failed (missing creation bytecode).');
    }
    // No constructor arguments
    return { parameters: [] };
  }

  try {
    return decodeConstructorArgs(abi, constructorArgs);
  } catch (error) {
    // If we used runtime bytecode, the slice may be too short; try brute-force recovery
    const usedRuntime = !creationBytecode && !!runtimeBytecode;

    if (usedRuntime) {
      const brute = bruteForceConstructorArgs(txInput, abi);
      if (brute) return brute;
    }

    const hint = usedRuntime
      ? ' Decoding failed using runtime bytecode; creation bytecode may be required.'
      : '';
    throw new Error(
      `${error instanceof Error ? error.message : 'Failed to decode constructor arguments.'}${hint}`
    );
  }
}

