'use client';

import { useState } from 'react';

interface TransactionInputProps {
  onDecode: (txHash: string, network: 'mainnet' | 'testnet') => void;
  isLoading: boolean;
}

export default function TransactionInput({ onDecode, isLoading }: TransactionInputProps) {
  const [txHash, setTxHash] = useState('');
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [error, setError] = useState('');

  const validateTxHash = (hash: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!txHash.trim()) {
      setError('Please enter a transaction hash');
      return;
    }

    if (!validateTxHash(txHash.trim())) {
      setError('Invalid transaction hash format. Must be 0x followed by 64 hex characters.');
      return;
    }

    onDecode(txHash.trim(), network);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Network Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Network:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNetwork('mainnet')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                network === 'mainnet'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mainnet
            </button>
            <button
              type="button"
              onClick={() => setNetwork('testnet')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                network === 'testnet'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Testnet
            </button>
          </div>
        </div>

        {/* Input Field */}
        <div className="relative">
          <input
            type="text"
            value={txHash}
            onChange={(e) => {
              setTxHash(e.target.value);
              setError('');
            }}
            placeholder="0x..."
            disabled={isLoading}
            className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-xl 
                     focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none
                     transition-all duration-200 font-mono
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-sm hover:shadow-md"
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 
                        pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 
                   text-white font-semibold rounded-xl shadow-lg shadow-purple-500/50
                   hover:shadow-xl hover:shadow-purple-500/60
                   transform hover:scale-[1.02] active:scale-[0.98]
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                   disabled:transform-none relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Decoding...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Decode Constructor
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
      </form>
    </div>
  );
}


