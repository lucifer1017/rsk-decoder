'use client';

interface Parameter {
  name: string;
  type: string;
  value: any;
  formattedValue: string;
}

interface ResultsDisplayProps {
  transactionHash: string;
  contractAddress: string;
  blockNumber: string;
  parameters: Parameter[];
}

export default function ResultsDisplay({
  transactionHash,
  contractAddress,
  blockNumber,
  parameters,
}: ResultsDisplayProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Decoded Constructor Arguments
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 font-medium">Contract Address:</span>
            <div className="mt-1 flex items-center gap-2">
              <code className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded">
                {contractAddress}
              </code>
              <button
                onClick={() => copyToClipboard(contractAddress)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Copy to clipboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div>
            <span className="text-gray-600 font-medium">Block Number:</span>
            <div className="mt-1">
              <code className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded">
                {blockNumber}
              </code>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <span className="text-gray-600 font-medium">Transaction Hash:</span>
            <div className="mt-1 flex items-center gap-2">
              <code className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded break-all">
                {transactionHash}
              </code>
              <button
                onClick={() => copyToClipboard(transactionHash)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Copy to clipboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Parameters Table */}
      {parameters.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <p className="text-yellow-800">This contract has no constructor parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Constructor Parameters ({parameters.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {parameters.map((param, index) => (
              <div
                key={index}
                className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {param.name || `Parameter ${index + 1}`}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-mono">
                        {param.type}
                      </span>
                    </div>
                    <div className="mt-2">
                      <code className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                        {param.formattedValue}
                      </code>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(param.formattedValue)}
                    className="md:ml-4 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 
                             hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    title="Copy value"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


