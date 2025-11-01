# EduChain Smart Contract Deployment Guide

## 📋 Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- MetaMask wallet with test tokens
- Git and basic command-line knowledge

## 🔧 Setup

### 1. Install Dependencies

```bash
cd contracts
forge install
```

This installs:
- OpenZeppelin Contracts
- Forge Standard Library

### 2. Configure Environment

Create a `.env` file in the `contracts` folder:

```bash
cp .env.example .env
```

Edit `.env` and add your private key:

```bash
PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

**⚠️ SECURITY WARNING:**
- Use a **NEW test wallet** for deployment
- Never commit `.env` to git (it's in `.gitignore`)
- Never use your main wallet's private key

### 3. Get Test Tokens

#### For Polygon Mumbai (Recommended):
- Add Mumbai network to MetaMask
- Visit: https://faucet.polygon.technology/
- Get free test MATIC

#### For Sepolia:
- Add Sepolia network to MetaMask
- Visit: https://sepoliafaucet.com/
- Get free test ETH

## 🚀 Deployment

### Option 1: Deploy to Polygon Mumbai (Recommended)

```bash
# Load environment variables
source .env

# Deploy
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc-mumbai.maticvigil.com \
  --broadcast \
  --legacy \
  -vvvv
```

### Option 2: Deploy to Sepolia

```bash
source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.sepolia.org \
  --broadcast \
  --legacy \
  -vvvv
```

### Option 3: Deploy to Local Anvil

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  -vvvv
```

## 📝 After Deployment

### 1. Save the Contract Address

You'll see output like:
```
PoolFactory deployed to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**SAVE THIS ADDRESS!**

### 2. Update Frontend Configuration

Edit `frontend/lib/contracts.ts`:

```typescript
export const POOL_FACTORY_ADDRESS = "0xYOUR_DEPLOYED_ADDRESS";

export const NETWORK_CONFIG = {
  chainId: 80001, // Mumbai: 80001, Sepolia: 11155111
  chainName: "Polygon Mumbai",
  rpcUrl: "https://rpc-mumbai.maticvigil.com",
  blockExplorer: "https://mumbai.polygonscan.com"
};
```

### 3. Update Backend Configuration

Edit `backend/.env`:

```bash
RPC_URL=https://rpc-mumbai.maticvigil.com
POOL_FACTORY_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

## ✅ Verify Deployment

### Check if contract exists:

```bash
cast code 0xYOUR_DEPLOYED_ADDRESS \
  --rpc-url https://rpc-mumbai.maticvigil.com
```

Should return bytecode (long hex string).

### Test contract function:

```bash
cast call 0xYOUR_DEPLOYED_ADDRESS \
  "poolCount()(uint256)" \
  --rpc-url https://rpc-mumbai.maticvigil.com
```

Should return `0` (no pools created yet).

### View on Block Explorer:

**Mumbai:** https://mumbai.polygonscan.com/address/0xYOUR_DEPLOYED_ADDRESS
**Sepolia:** https://sepolia.etherscan.io/address/0xYOUR_DEPLOYED_ADDRESS

## 🔍 Contract Verification (Optional)

Verify your contract source code on the block explorer:

### For Mumbai:

```bash
forge verify-contract \
  0xYOUR_DEPLOYED_ADDRESS \
  src/PoolFactory.sol:PoolFactory \
  --chain-id 80001 \
  --etherscan-api-key YOUR_POLYGONSCAN_API_KEY
```

Get API key from: https://polygonscan.com/apis

### For Sepolia:

```bash
forge verify-contract \
  0xYOUR_DEPLOYED_ADDRESS \
  src/PoolFactory.sol:PoolFactory \
  --chain-id 11155111 \
  --etherscan-api-key YOUR_ETHERSCAN_API_KEY
```

Get API key from: https://etherscan.io/apis

## 🧪 Testing

Run contract tests:

```bash
forge test
```

Run with gas reporting:

```bash
forge test --gas-report
```

Run specific test:

```bash
forge test --match-test testCreatePool -vvvv
```

## 📊 Build & Compile

Compile contracts:

```bash
forge build
```

Clean and rebuild:

```bash
forge clean
forge build
```

Get contract ABI:

```bash
forge inspect PoolFactory abi > abi/PoolFactory.json
```

## 🔄 Deployment Checklist

- [ ] Dependencies installed (`forge install`)
- [ ] `.env` file created with private key
- [ ] Test tokens received in wallet
- [ ] Contract compiled successfully (`forge build`)
- [ ] Tests passing (`forge test`)
- [ ] Deployed to testnet
- [ ] Contract address saved
- [ ] Frontend config updated
- [ ] Backend config updated
- [ ] Contract verified on explorer (optional)
- [ ] Deployment tested with test transaction

## 🚨 Troubleshooting

### "Failed to get EIP-1559 fees"
- Add `--legacy` flag to deployment command

### "Insufficient funds"
- Get more test tokens from faucet
- Check you're on the correct network

### "Nonce too high"
- Reset your wallet's nonce in MetaMask
- Or wait a few minutes and try again

### "Contract not found"
- Wait 30 seconds after deployment
- Check block explorer for transaction status

### "Import not found"
- Run `forge install` to install dependencies
- Check `foundry.toml` remappings

## 📚 Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Polygon Mumbai Faucet](https://faucet.polygon.technology/)
- [Mumbai Block Explorer](https://mumbai.polygonscan.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🎯 Network Details

### Polygon Mumbai Testnet
```
Network Name: Polygon Mumbai
RPC URL: https://rpc-mumbai.maticvigil.com
Chain ID: 80001
Currency: MATIC
Explorer: https://mumbai.polygonscan.com
Faucet: https://faucet.polygon.technology/
```

### Sepolia Testnet
```
Network Name: Sepolia
RPC URL: https://rpc.sepolia.org
Chain ID: 11155111
Currency: ETH
Explorer: https://sepolia.etherscan.io
Faucet: https://sepoliafaucet.com/
```

---

**Need help?** Check the troubleshooting section or open an issue on GitHub.
