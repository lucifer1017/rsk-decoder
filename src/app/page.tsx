'use client';

import { useState } from 'react';
import TransactionInput from '@/components/TransactionInput';
import ResultsDisplay from '@/components/ResultsDisplay';

interface DecodedData {
  transactionHash: string;
  contractAddress: string;
  blockNumber: string;
  parameters: Array<{
    name: string;
    type: string;
    value: any;
    formattedValue: string;
  }>;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async (txHash: string, network: 'mainnet' | 'testnet') => {
    setIsLoading(true);
    setError(null);
    setDecodedData(null);

    try {
      const response = await fetch('/api/decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txHash, network }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to decode transaction');
      }

      setDecodedData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Rootstock Constructor Decoder
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Decode constructor arguments from contract deployment transactions on Rootstock
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Built for Rootstock Hacktivator 3.0</span>
          </div>
        </div>

        <div className="mb-12">
          <TransactionInput onDecode={handleDecode} isLoading={isLoading} />
        </div>

        {error && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {decodedData && (
          <div className="animate-fade-in">
            <ResultsDisplay
              transactionHash={decodedData.transactionHash}
              contractAddress={decodedData.contractAddress}
              blockNumber={decodedData.blockNumber}
              parameters={decodedData.parameters}
            />
          </div>
        )}

        {!decodedData && !error && !isLoading && (
          <div className="mt-16 text-center">
            <div className="inline-block bg-gray-50 rounded-2xl px-8 py-6 border border-gray-200">
              <p className="text-gray-600 mb-2">How it works:</p>
              <ol className="text-left text-sm text-gray-600 space-y-2 max-w-md">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">1.</span>
                  <span>Enter a deployment transaction hash</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">2.</span>
                  <span>We fetch the transaction data and contract address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">3.</span>
                  <span>We retrieve the contract ABI from Blockscout</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">4.</span>
                  <span>We decode and display the constructor arguments</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
