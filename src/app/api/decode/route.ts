import { NextRequest, NextResponse } from 'next/server';
import { getTransactionByHash, getTransactionReceipt } from '@/lib/rpc';
import { getContractABI } from '@/lib/blockscout';
import { decodeConstructorFromTx } from '@/lib/decoder';

export interface DecodeResponse {
  success: boolean;
  data?: {
    transactionHash: string;
    contractAddress: string;
    blockNumber: string;
    parameters: Array<{
      name: string;
      type: string;
      value: any;
      formattedValue: string;
    }>;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, network = 'mainnet' } = body;

    // Validate input
    if (!txHash) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    // Validate tx hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Step 1: Get transaction data
    const txData = await getTransactionByHash(txHash, network as 'mainnet' | 'testnet');

    // Step 2: Get transaction receipt to find contract address
    const receipt = await getTransactionReceipt(txHash, network as 'mainnet' | 'testnet');

    if (!receipt.contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Transaction did not create a contract' },
        { status: 400 }
      );
    }

    // Step 3: Fetch contract ABI from Blockscout
    let abi;
    try {
      abi = await getContractABI(receipt.contractAddress, network as 'mainnet' | 'testnet');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch contract ABI. Contract may not be verified.',
        },
        { status: 404 }
      );
    }

    // Step 4: Decode constructor arguments
    let decoded;
    try {
      decoded = await decodeConstructorFromTx(
        txData.input,
        abi,
        receipt.contractAddress,
        network as 'mainnet' | 'testnet'
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to decode constructor arguments',
        },
        { status: 500 }
      );
    }

    // Return success response
    const response: DecodeResponse = {
      success: true,
      data: {
        transactionHash: txHash,
        contractAddress: receipt.contractAddress,
        blockNumber: txData.blockNumber,
        parameters: decoded.parameters,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}




