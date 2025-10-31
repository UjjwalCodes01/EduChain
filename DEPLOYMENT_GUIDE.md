# Contract Deployment & Configuration Guide

## Overview
All mock/fallback data has been removed. The frontend now fetches all data from:
- **Smart Contracts**: Pool data, scholarship information, balances
- **Backend API**: User profiles, applications, verification status

## 🚀 Deployment Steps

### 1. Deploy Smart Contracts

Navigate to the contracts directory and deploy:

```bash
cd contracts
forge build
forge script script/Deploy.s.sol --rpc-url <YOUR_RPC_URL> --broadcast
```

Or for local testing with Hardhat:

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Update Contract Addresses

After deployment, update the contract address in:

**File**: `frontend/lib/contracts.ts`

```typescript
export const POOL_FACTORY_ADDRESS = "YOUR_DEPLOYED_FACTORY_ADDRESS";
```

### 3. Verify Network Configuration

Update the network configuration if not using local Hardhat:

```typescript
export const NETWORK_CONFIG = {
  chainId: 1, // Mainnet: 1, Goerli: 5, Sepolia: 11155111
  chainName: "Ethereum Mainnet",
  rpcUrl: "YOUR_RPC_URL"
};
```

## 📝 Files Updated (Mock Data Removed)

### Frontend Pages:
1. ✅ **`app/admin/page.tsx`** - Now fetches pools from PoolFactory contract
2. ✅ **`app/Home/page.tsx`** - Fetches all pools from blockchain
3. ✅ **`app/my-pools/page.tsx`** - Removed mock pools, requires contract deployment
4. ✅ **`app/pool/[address]/page.tsx`** - Fetches pool details from contract
5. ✅ **`app/profile/page.tsx`** - Removed mock profile, requires backend registration

### Changes Made:

#### Admin Dashboard (`app/admin/page.tsx`)
- Removed hardcoded mock pools
- Integrated `getPoolsByCreator()` contract call
- Fetches real-time pool data from blockchain

#### Home Page (`app/Home/page.tsx`)
- Removed 3 mock scholarship pools
- Integrated `getAllPools()` contract call
- Displays only deployed pools

#### My Pools (`app/my-pools/page.tsx`)
- Removed fallback mock data
- Shows error if PoolFactory not deployed

#### Pool Details (`app/pool/[address]/page.tsx`)
- Removed hardcoded pool details
- Fetches all data from pool contract

#### Profile Page (`app/profile/page.tsx`)
- Removed mock profile fallback
- Requires user to complete registration

## 🔧 Contract Functions Used

### PoolFactory Contract:
- `getAllPools()` - Get all deployed pools
- `getPoolsByCreator(address)` - Get pools by creator
- `poolCount()` - Total number of pools

### ScholarshipPool Contract:
- `poolName()` - Pool name
- `poolDescription()` - Description
- `scholarshipAmount()` - Amount per scholarship
- `applicationDeadline()` - Deadline timestamp
- `balance()` - Pool balance
- `totalScholarshipsAwarded()` - Count of awards
- `totalApplications()` - Application count
- `admin()` - Pool admin address
- `paused()` - Paused status

## ⚠️ Important Notes

1. **Contract Deployment Required**: Application will show errors if contracts are not deployed
2. **Backend Running**: Ensure backend server is running on `http://localhost:5000`
3. **MetaMask Required**: Users must have MetaMask installed
4. **Network Sync**: Frontend and contracts must be on the same network

## 🔗 Data Flow

```
User Action → MetaMask → Smart Contract → Frontend Display
                ↓
         Backend API (for applications/verification)
```

### Blockchain Data:
- Pool creation and management
- Scholarship amounts and balances
- Application deadlines
- Pool statistics

### Backend Data:
- User registration and verification
- Application submissions
- Email verification status
- Admin approvals
- Transaction history

## 🧪 Testing Checklist

- [ ] Deploy PoolFactory contract
- [ ] Update `POOL_FACTORY_ADDRESS` in `frontend/lib/contracts.ts`
- [ ] Create at least one pool via frontend
- [ ] Verify pool appears on Home page
- [ ] Test application submission
- [ ] Verify admin dashboard shows pools
- [ ] Test pool details page

## 📚 Additional Resources

- Contract ABIs are centralized in `frontend/lib/contracts.ts`
- Backend API documentation in `backend/README.md`
- Contract documentation in `contracts/README.md`

## 🐛 Troubleshooting

**Error: "Failed to load pools from blockchain"**
- Check if contracts are deployed
- Verify contract address in `contracts.ts`
- Ensure MetaMask is connected to correct network

**Error: "Profile not found"**
- User needs to complete registration at `/details`
- Check backend is running

**Empty pool list**
- No pools created yet - create one at `/create-pool`
- Check network is correct
