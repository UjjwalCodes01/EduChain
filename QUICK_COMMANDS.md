# 🚀 EduChain Quick Command Reference

## Smart Contract Deployment

```bash
# Navigate to contracts
cd contracts

# Compile contracts
forge build

# Run tests
forge test
forge test -vvv  # verbose output

# Deploy to Mumbai
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc-mumbai.maticvigil.com \
  --broadcast \
  --legacy \
  -vvvv

# Deploy to Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.sepolia.org \
  --broadcast \
  --legacy \
  -vvvv

# Verify on block explorer (optional)
forge verify-contract \
  0xYOUR_CONTRACT_ADDRESS \
  src/PoolFactory.sol:PoolFactory \
  --chain-id 80001 \
  --etherscan-api-key YOUR_API_KEY
```

## Backend Commands

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm start

# Test email sending
curl http://localhost:5000/api/otp/send \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test Kwala health endpoint
curl http://localhost:5000/api/kwala/health
```

## Frontend Commands

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Useful Cast Commands (Foundry)

```bash
# Check contract code exists
cast code 0xYOUR_ADDRESS --rpc-url https://rpc-mumbai.maticvigil.com

# Read pool count
cast call 0xFACTORY_ADDRESS \
  "getPoolCount()(uint256)" \
  --rpc-url https://rpc-mumbai.maticvigil.com

# Get pool info
cast call 0xFACTORY_ADDRESS \
  "getPoolInfo(address)(string,string,uint256,uint256,uint256,uint256,uint256,address)" \
  0xPOOL_ADDRESS \
  --rpc-url https://rpc-mumbai.maticvigil.com

# Check if address has role
cast call 0xPOOL_ADDRESS \
  "hasRole(bytes32,address)(bool)" \
  0xROLE_HASH \
  0xWALLET_ADDRESS \
  --rpc-url https://rpc-mumbai.maticvigil.com

# Get AUTOMATION_ROLE hash
cast call 0xPOOL_ADDRESS \
  "AUTOMATION_ROLE()(bytes32)" \
  --rpc-url https://rpc-mumbai.maticvigil.com

# Check application status
cast call 0xPOOL_ADDRESS \
  "applications(address)(address,string,bool,bool,bool,uint256)" \
  0xSTUDENT_ADDRESS \
  --rpc-url https://rpc-mumbai.maticvigil.com
```

## Grant Role to Kwala (via Cast)

```bash
# Get AUTOMATION_ROLE hash
ROLE=$(cast call 0xPOOL_ADDRESS "AUTOMATION_ROLE()(bytes32)" --rpc-url https://rpc-mumbai.maticvigil.com)

# Grant role to Kwala wallet
cast send 0xPOOL_ADDRESS \
  "grantRole(bytes32,address)" \
  $ROLE \
  0xKWALA_WALLET_ADDRESS \
  --rpc-url https://rpc-mumbai.maticvigil.com \
  --private-key YOUR_PRIVATE_KEY
```

## Test Kwala Endpoints

```bash
# Health check
curl https://your-backend.com/api/kwala/health

# Test review application
curl https://your-backend.com/api/kwala/review-application \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KWALA_SECRET" \
  -d '{
    "studentAddress": "0x123...",
    "dataHash": "Qm...",
    "poolAddress": "0xABC..."
  }'

# Test get approved students
curl https://your-backend.com/api/kwala/get-approved-students \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KWALA_SECRET" \
  -d '{
    "poolAddress": "0xABC...",
    "chainId": 80001
  }'
```

## MongoDB Commands

```bash
# Start MongoDB (if local)
mongod

# Connect to MongoDB
mongosh

# Use educhain database
use educhain

# View users
db.users.find().pretty()

# Find verified users
db.users.find({ isEmailVerified: true }).pretty()

# Count applications
db.applications.count()

# Clear test data
db.users.deleteMany({ email: { $regex: "test" } })
```

## Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Add Kwala integration with AccessControl"

# Push to GitHub
git push origin main

# Create new branch for testing
git checkout -b kwala-integration

# View commit history
git log --oneline
```

## Environment Setup

```bash
# Generate random secret for Kwala
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Check Node version
node --version  # Should be v18+

# Check npm version
npm --version

# Check Foundry version
forge --version
cast --version
```

## Network Configuration

### Polygon Mumbai
```bash
Network Name: Polygon Mumbai
RPC URL: https://rpc-mumbai.maticvigil.com
Chain ID: 80001
Currency: MATIC
Explorer: https://mumbai.polygonscan.com
Faucet: https://faucet.polygon.technology/
```

### Ethereum Sepolia
```bash
Network Name: Sepolia
RPC URL: https://rpc.sepolia.org
Chain ID: 11155111
Currency: ETH
Explorer: https://sepolia.etherscan.io
Faucet: https://sepoliafaucet.com/
```

## Quick Deployment Flow

```bash
# 1. Deploy contracts
cd contracts
forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc-mumbai.maticvigil.com --broadcast --legacy -vvvv

# 2. Update frontend config
# Edit frontend/lib/contracts.ts with deployed address

# 3. Update backend config
# Edit backend/.env with deployed address and RPC URL

# 4. Start backend
cd backend && npm start

# 5. Start frontend (new terminal)
cd frontend && npm run dev

# 6. Test locally at http://localhost:3000

# 7. Deploy backend to Render
# Connect GitHub repo, select backend folder, add env vars

# 8. Deploy frontend to Vercel
# Connect GitHub repo, auto-detected Next.js, deploy

# 9. Set up Kwala
# Create account, fund wallet, upload workflows, grant role

# 10. Test end-to-end!
```

## Troubleshooting Commands

```bash
# Clear Node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Foundry cache
forge clean

# Check which port is using 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process on port
kill -9 <PID>  # Mac/Linux

# Check environment variables loaded
node -e "require('dotenv').config(); console.log(process.env)"

# Test MongoDB connection
node -e "require('mongoose').connect('mongodb://localhost:27017/educhain').then(() => console.log('✅ Connected')).catch(e => console.error('❌', e))"
```

## Deployment Verification

```bash
# After deployment, verify everything works:

# 1. Check contract exists
cast code 0xYOUR_ADDRESS --rpc-url https://rpc-mumbai.maticvigil.com

# 2. Check backend health
curl https://your-backend.com/health

# 3. Check frontend loads
curl https://your-frontend.vercel.app

# 4. Check Kwala endpoints
curl https://your-backend.com/api/kwala/health

# 5. Check role granted
cast call 0xPOOL_ADDRESS \
  "hasRole(bytes32,address)(bool)" \
  $(cast call 0xPOOL_ADDRESS "AUTOMATION_ROLE()(bytes32)" --rpc-url https://rpc-mumbai.maticvigil.com) \
  0xKWALA_WALLET \
  --rpc-url https://rpc-mumbai.maticvigil.com
```

---

## 📋 Pre-Deployment Checklist

- [ ] `contracts/.env` has PRIVATE_KEY
- [ ] Wallet has test tokens (Mumbai MATIC or Sepolia ETH)
- [ ] `forge build` compiles successfully
- [ ] `forge test` all tests pass
- [ ] `backend/.env` has all required variables
- [ ] `backend/package.json` dependencies installed
- [ ] `frontend/lib/contracts.ts` ready to update
- [ ] MongoDB running (if local)
- [ ] Email credentials working (test OTP)
- [ ] IPFS credentials configured

## 🎯 Post-Deployment Checklist

- [ ] PoolFactory address saved
- [ ] frontend/lib/contracts.ts updated
- [ ] backend/.env updated with RPC_URL and POOL_FACTORY_ADDRESS
- [ ] Test pool created via frontend
- [ ] Test pool funded with MATIC
- [ ] Backend deployed to Render/Railway
- [ ] Frontend deployed to Vercel
- [ ] Kwala account created
- [ ] Kwala wallet funded with gas
- [ ] AUTOMATION_ROLE granted to Kwala
- [ ] Workflows uploaded to Kwala
- [ ] End-to-end test completed
- [ ] Demo video recorded
- [ ] GitHub repo public
- [ ] README updated

---

**Keep this file handy during deployment!** 📌
