# 🔗 EduChain Frontend-Backend-Contract Connection Guide

## ✅ Deployment Status

### Smart Contracts (Sepolia Testnet)
- **PoolFactory**: `0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a`
- **ScholarshipPool**: `0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE`
- **Network**: Sepolia (Chain ID: 11155111)
- **Status**: ✅ Deployed & Verified

### Backend API
- **URL**: `https://educhain-3.onrender.com`
- **Status**: ✅ Deployed (MongoDB connection pending)
- **Health Check**: `https://educhain-3.onrender.com/api/kwala/health`

### Frontend
- **Status**: ⏳ Ready to deploy
- **Environment**: Configured with production backend

---

## 🚀 Quick Start Guide

### 1. Start the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The app will run at: `http://localhost:3000`

### 2. Test Contract Connection

Open the frontend and:

1. **Connect MetaMask**
   - Click "Connect Wallet" button
   - Switch to Sepolia testnet
   - Approve the connection

2. **View Pools**
   - Navigate to "Browse Pools"
   - You should see "KWALA Scholarship 2025"
   - Pool details should load from blockchain

3. **Test Application Flow**
   - Click on the pool
   - Fill out application form
   - Submit application (requires Sepolia ETH for gas)

---

## 🔧 Frontend Configuration

### Environment Variables (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://educhain-3.onrender.com
```

### Contract Addresses (`lib/contracts.ts`)
```typescript
export const POOL_FACTORY_ADDRESS = "0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a";
export const SCHOLARSHIP_POOL_ADDRESS = "0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE";
```

### Network Configuration
- **Chain ID**: 11155111 (Sepolia)
- **RPC URL**: `https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh`
- **Explorer**: https://sepolia.etherscan.io

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### OTP
- `POST /api/otp/send` - Send OTP to email
- `POST /api/otp/verify` - Verify OTP code

### Applications
- `POST /api/applications` - Submit application
- `GET /api/applications/:walletAddress` - Get user applications
- `GET /api/applications/pool/:poolAddress` - Get pool applications

### KWALA Automation
**Status**: ⚠️ REMOVED - Not using KWALA for automation

---

## 🧪 Testing the Full Flow

### Step 1: User Registration
```javascript
// Frontend: Register page
1. Fill in: Name, Email, Password, Wallet Address
2. Click "Register"
3. Backend creates user in MongoDB
4. Redirects to login
```

### Step 2: Email Verification
```javascript
// Frontend: Profile page
1. Click "Verify Email"
2. OTP sent to email via backend
3. Enter OTP code
4. Backend verifies and marks email as verified
```

### Step 3: Apply for Scholarship
```javascript
// Frontend: Pool details page
1. Click "Apply Now"
2. Fill application form
3. Upload documents (stored in IPFS via backend)
4. Submit transaction to blockchain
5. Backend stores application data
6. KWALA workflow triggered
```

### Step 4: Admin Reviews Application (Manual)
```javascript
// Admin manually reviews and approves:
1. Admin logs into dashboard
2. Views pending applications
3. Reviews student documents
4. Approves/rejects application manually
5. Calls approveApplication() or rejectApplication()
6. Student receives notification
```

### Step 5: Payment (Manual by Admin)
```javascript
// Admin initiates payment:
1. Admin views approved applications
2. Selects students for payment
3. Calls payScholarship(studentAddress) or batchPayScholarships()
4. ETH transferred from pool to student
5. ScholarshipPaid event emitted
6. Backend logs transaction
7. Student notified via email
```

---

## 🔑 Important Addresses & Keys

### Contract Roles
- **ADMIN_ROLE**: `keccak256("ADMIN_ROLE")`
  - Can: withdraw funds, pause, update settings
  
- **AUTOMATION_ROLE**: `0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775`
  - Can: verify, approve, reject, pay scholarships
  - Must be granted to KWALA wallet

### Your Wallet (Admin)
- **Address**: `0xa22db5e0d0df88424207b6fade76ae7a6faabe94`
- **Has Roles**: DEFAULT_ADMIN_ROLE, ADMIN_ROLE, AUTOMATION_ROLE

---

## 🐛 Troubleshooting

### Issue: "Failed to connect wallet"
**Solution**: 
- Install MetaMask extension
- Switch to Sepolia testnet
- Add network manually if needed:
  - RPC: `https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh`
  - Chain ID: 11155111

### Issue: "Failed to send OTP"
**Solution**:
- Check backend is running: `https://educhain-3.onrender.com/api/kwala/health`
- Verify `.env.local` has correct API URL
- Restart frontend dev server

### Issue: "Transaction failed"
**Solution**:
- Ensure you have Sepolia ETH (get from faucet)
- Check gas estimation
- Verify contract addresses are correct

### Issue: "Pool not found"
**Solution**:
- Verify POOL_FACTORY_ADDRESS in `lib/contracts.ts`
- Check contract is deployed: https://sepolia.etherscan.io/address/0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a

---

## 📦 Next Steps

### 1. Fix MongoDB Connection
```bash
# Backend needs MongoDB Atlas
1. Create MongoDB Atlas cluster (free tier)
2. Get connection string
3. Update MONGO_URI in Render dashboard
4. Redeploy backend
```

### 2. Admin Dashboard Setup
```bash
# Create admin account in MongoDB
# Admin can manually:
# - Review applications
# - Approve/reject students
# - Process payments
# - Manage pool settings
```

### 3. Deploy Frontend to Vercel
```bash
cd frontend
vercel --prod

# Set environment variable in Vercel:
# NEXT_PUBLIC_API_URL=https://educhain-3.onrender.com
```

---

## 📚 Key Files

### Frontend
- `lib/contracts.ts` - Contract addresses & ABIs
- `lib/api.ts` - API endpoints configuration
- `.env.local` - Environment variables

### Backend
- `app.js` - Main Express server
- `routes/applicationRoutes.js` - Application management
- `routes/authRoutes.js` - Authentication
- `routes/otpRoutes.js` - OTP verification
- `routes/adminRoutes.js` - Admin dashboard
- `routes/userRoutes.js` - User management

### Contracts
- `src/PoolFactory.sol` - Pool creation factory
- `src/ScholarshipPool.sol` - Individual scholarship pool with manual admin controls
- `script/Deploy.s.sol` - Deployment script

---

## 🎯 Current Status Summary

✅ **Complete**:
- Smart contracts deployed to Sepolia
- Backend deployed to Render
- Frontend configured with contract addresses & API
- Manual admin workflow for application review

⏳ **Pending**:
- MongoDB Atlas connection (backend)
- Admin dashboard implementation
- Frontend deployment to Vercel
- End-to-end testing

🔴 **Blockers**:
- MongoDB Atlas needed for backend to work fully
- Admin dashboard UI needs to be built

---

## 📞 Support

- **Contracts**: https://sepolia.etherscan.io/address/0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE
- **Backend**: https://educhain-3.onrender.com
- **Health Check**: https://educhain-3.onrender.com/api/kwala/health

---

**Last Updated**: November 1, 2025
