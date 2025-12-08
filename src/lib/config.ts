export const config = {
  rpc: {
    mainnet: process.env.NEXT_PUBLIC_ROOTSTOCK_RPC_MAINNET || 'https://public-node.rsk.co',
    testnet: process.env.NEXT_PUBLIC_ROOTSTOCK_RPC_TESTNET || 'https://public-node.testnet.rsk.co',
  },
  blockscout: {
    mainnet: process.env.NEXT_PUBLIC_BLOCKSCOUT_API_MAINNET || 'https://rootstock.blockscout.com/api',
    testnet: process.env.NEXT_PUBLIC_BLOCKSCOUT_API_TESTNET || 'https://rootstock-testnet.blockscout.com/api',
  },
  // Default to mainnet
  defaultNetwork: 'mainnet' as 'mainnet' | 'testnet',
};


