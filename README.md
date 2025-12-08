# Rootstock Constructor Decoder

A vital tool for the Rootstock inspection suite that decodes constructor arguments from contract deployment transactions. Essential for auditing, forking, and understanding the initial state of contracts on Rootstock.

## Features

- Decode constructor arguments from deployment transactions
- Support for Mainnet and Testnet
- Handles complex types (tuples, structs, arrays)
- Modern, futuristic UI with clean parameter display
- Copy-to-clipboard functionality for addresses and values

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Select Network**: Choose Mainnet or Testnet from the network selector
2. **Enter Transaction Hash**: Paste a deployment transaction hash (must be a contract creation transaction)
3. **Decode**: Click "Decode Constructor" to fetch and decode the constructor arguments
4. **View Results**: See the decoded parameters with their names, types, and values

### Important Notes

- The transaction must be a **contract deployment** (not a regular transaction)
- The contract must be **verified on Blockscout** (for ABI availability)
- Only verified contracts can be decoded

## Test Transaction Hashes

### Mainnet
- `0x700a790a844183eb9bec20ce158c1f7fa995304ab5d0b21f3baf119defabf8cf`
- `0x5b17bc770b4462dfc042f9b87564087dcf8708b38b6bc9ab4afd1b23750822d6`
- `0x3bb53bedd7c536e19c8f84e82da13c9a4736a1b31802988fd138c08cd52df12c`
- `0x6c81e209f52146361006bdc7209a5a5a1efa0c3b7406865936b9642b762c38ee`
- `0x6a147769153e57d63da8e0c1e1d2d175b10ccf4e4bd77af46173640750dcff71`

### Testnet
- `0x44d37d04c72a46fa61f941a81fa11660634090f66f9430caf925c04063a84003`
- `0x7f2a27bb595e425b27403942f40c476bddb371d7220178839bba1f0bfb3442e6`
- `0xb1383a1931ed31b5b62449adff6871fabe698a03df6360d41ed0b43a46a07bd6`
- `0x4cc48245c2c4142832f929c9142019dba7537d9cffd63cbd88cb47c9c898d4ce`
- `0x92615f27edea8134c2afc103b49a25752cf706c1db8187aff24aa37b47318245`

## How It Works

1. Fetches transaction data using `eth_getTransactionByHash`
2. Retrieves contract address from `eth_getTransactionReceipt`
3. Fetches contract ABI from Rootstock Block Explorer API
4. Extracts constructor arguments from transaction input (after bytecode)
5. Decodes arguments using the constructor's ABI
6. Displays formatted results with parameter names and values

## Built With

- Next.js 16
- React 19
- TypeScript
- ethers.js v6
- Tailwind CSS

## Project Structure

```
rskdecoder/
├── src/
│   ├── app/
│   │   ├── api/decode/    # API route for decoding
│   │   └── page.tsx       # Main page component
│   ├── components/         # React components
│   └── lib/                # Core utilities (RPC, decoder, Blockscout API)
```

## License

Built for Rootstock Hacktivator 3.0
