# 🚀 Quick Commands - EduChain Platform

All essential commands in one place for easy reference.

---

## 📱 Platform URLs

- **Backend API**: https://educhain-3.onrender.com
- **Health Check**: https://educhain-3.onrender.com/health
- **Factory Contract**: https://sepolia.etherscan.io/address/0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a
- **Pool Contract**: https://sepolia.etherscan.io/address/0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE
- **Sepolia Faucet**: https://sepoliafaucet.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 🚀 Quick Start (45 minutes total)

### 1. MongoDB Atlas (5 min)
```bash
# Go to: https://cloud.mongodb.com
# 1. Create account
# 2. Create free M0 cluster
# 3. Create database user
# 4. Whitelist IP: 0.0.0.0/0
# 5. Copy connection string
```

### 2. Update Render (2 min)
```bash
# Go to: https://dashboard.render.com
# Environment tab → Add:
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/educhain
```

### 3. Deploy to Vercel (3 min)
```bash
cd frontend
vercel --prod
# Add environment variables when prompted
```

### 4. Update CORS (1 min)
```bash
# Back to Render → Add:
FRONTEND_URL=https://edu-chain-zeta.vercel.app/
```

### 5. Test Everything (30 min)
```bash
# Follow TESTING_GUIDE.md
```

---

## 💻 Development

### Start Backend Locally
```bash
cd backend
npm install
npm start
# Runs on: http://localhost:10000
```

### Start Frontend Locally
```bash
cd frontend
npm install
npm run dev
# Visit: http://localhost:3000
```

### Test MongoDB Connection
```bash
cd backend
node test-mongo.js
```

---

## 🔗 Smart Contracts

### Build
```bash
cd contracts
forge build
```

### Test
```bash
cd contracts
forge test -vv
```

### Get Pool Count
```bash
cast call 0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a \
  "getPoolCount()(uint256)" \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
```

### Get Pools by Creator
```bash
cast call 0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a \
  "getPoolsByCreator(address)(address[])" \
  "YOUR_WALLET_ADDRESS" \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
```

### Get Pool Stats
```bash
cast call POOL_ADDRESS \
  "getPoolStats()(uint256,uint256,uint256,uint256,uint256,uint256)" \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
```

### Grant Admin Role
```bash
cast send POOL_ADDRESS \
  "grantRole(bytes32,address)" \
  "0x0000000000000000000000000000000000000000000000000000000000000000" \
  "ADMIN_WALLET" \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh \
  --private-key YOUR_PRIVATE_KEY
```

---

## 🌐 Vercel Deployment

### Install CLI
```bash
npm install -g vercel
```

### Login
```bash
vercel login
```

### Deploy
```bash
cd frontend
vercel --prod
```

### Add Environment Variables
```bash
vercel env add NEXT_PUBLIC_API_URL
# Value: https://educhain-3.onrender.com

vercel env add NEXT_PUBLIC_POOL_FACTORY_ADDRESS
# Value: 0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a

vercel env add NEXT_PUBLIC_SCHOLARSHIP_POOL_ADDRESS
# Value: 0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE

vercel env add NEXT_PUBLIC_CHAIN_ID
# Value: 11155111

vercel env add NEXT_PUBLIC_RPC_URL
# Value: https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
```

### View Logs
```bash
vercel logs --follow
```

---

## 🔧 Environment Variables

### Backend (Render)
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/educhain?retryWrites=true&w=majority
FRONTEND_URL=https://edu-chain-zeta.vercel.app/
JWT_SECRET=your-random-32-char-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
PORT=10000
NODE_ENV=production
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://educhain-3.onrender.com
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a
NEXT_PUBLIC_SCHOLARSHIP_POOL_ADDRESS=0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
```

---

## 🧪 Testing

### Health Check
```bash
curl https://educhain-3.onrender.com/health
```

### Test OTP
```bash
curl -X POST https://educhain-3.onrender.com/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"registration"}'
```

### Get Applications
```bash
curl https://educhain-3.onrender.com/api/applications/pool/POOL_ADDRESS
```

---

## 📚 Documentation

- **Complete Setup**: `SETUP_COMPLETE.md`
- **MongoDB Setup**: `MONGODB_SETUP.md`
- **Vercel Deployment**: `VERCEL_DEPLOYMENT.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Connection Guide**: `CONNECTION_GUIDE.md`

---

*Last Updated: November 1, 2025*
