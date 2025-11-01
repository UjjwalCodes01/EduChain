# 🚀 EduChain + Kwala Integration Guide

## 📋 What You Just Built

You've upgraded your scholarship platform to be **fully automated** using Kwala. Here's what's automated:

### ✅ **Step 1 Completed: AccessControl Integration**

Your `ScholarshipPool.sol` contract now uses **OpenZeppelin AccessControl** instead of Ownable:

- **ADMIN_ROLE**: Pool creator (can withdraw funds, pause, update settings)
- **AUTOMATION_ROLE**: Kwala bot (can verify, approve, and pay students)

This means **Kwala can act as an automated administrator** without having full owner privileges.

### 🎯 **What Kwala Will Automate**

#### Workflow #1: Auto-Review Applications (Event-Driven)
- **Trigger**: Student submits application → `ApplicationSubmitted` event fires
- **Action 1**: Kwala calls your backend API to review IPFS data
- **Action 2**: If approved, Kwala calls `verifyApplication()` on contract
- **Action 3**: Kwala calls `approveApplication()` on contract
- **Action 4**: Kwala calls your backend to send approval email to student

**Result**: Students get instant approval without provider doing anything!

#### Workflow #2: Auto-Payroll (Time-Based)
- **Trigger**: Every Friday at 5 PM (cron schedule)
- **Action 1**: Kwala calls your backend to get list of approved/unpaid students
- **Action 2**: Kwala calls `batchPayScholarships()` to pay everyone at once
- **Action 3**: Kwala calls your backend to send payment confirmation emails

**Result**: Scholarships automatically paid weekly!

---

## 🔧 Setup Instructions

### Phase 1: Deploy Your Smart Contract

1. **Set Your Private Key**
   ```bash
   # Edit contracts/.env
   PRIVATE_KEY=your_metamask_private_key_without_0x
   ```

2. **Get Test Tokens**
   - **Mumbai**: https://faucet.polygon.technology/
   - **Sepolia**: https://sepoliafaucet.com/

3. **Deploy to Testnet**
   ```bash
   cd contracts
   
   # For Mumbai (recommended)
   forge script script/Deploy.s.sol:Deploy \
     --rpc-url https://rpc-mumbai.maticvigil.com \
     --broadcast \
     --legacy \
     -vvvv
   
   # OR for Sepolia
   forge script script/Deploy.s.sol:Deploy \
     --rpc-url https://rpc.sepolia.org \
     --broadcast \
     --legacy \
     -vvvv
   ```

4. **Save the Deployed Address**
   ```
   PoolFactory deployed to: 0xYOUR_ADDRESS_HERE
   ```

5. **Update Frontend Config**
   ```typescript
   // frontend/lib/contracts.ts
   export const POOL_FACTORY_ADDRESS = "0xYOUR_ADDRESS_HERE";
   export const NETWORK_CONFIG = {
     chainId: 80001, // Mumbai
     chainName: "Polygon Mumbai",
     rpcUrl: "https://rpc-mumbai.maticvigil.com",
     blockExplorer: "https://mumbai.polygonscan.com"
   };
   ```

6. **Update Backend Config**
   ```bash
   # backend/.env
   RPC_URL=https://rpc-mumbai.maticvigil.com
   POOL_FACTORY_ADDRESS=0xYOUR_ADDRESS_HERE
   ```

### Phase 2: Create a Scholarship Pool

1. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Register as Provider**
   - Go to: http://localhost:3000
   - Click "Register" → Select "Provider"
   - Verify email with OTP

3. **Create Your First Pool**
   - Go to "Create Pool" page
   - Fill in details:
     - Name: "Test Scholarship 2024"
     - Description: "For CS students"
     - Amount: 0.1 MATIC
     - Deadline: Future date
   - Connect MetaMask and confirm transaction
   - **SAVE THE POOL ADDRESS** (e.g., `0xABC123...`)

4. **Fund the Pool**
   - Send test MATIC to the pool address
   - Or use the "Fund Pool" button in your frontend

### Phase 3: Set Up Kwala Automation

#### Step 3.1: Create Kwala Account

1. Go to: https://kwala.network/
2. Sign up for free account
3. Connect your wallet (use a separate automation wallet)
4. Fund automation wallet with small amount of test tokens (0.1 MATIC)

#### Step 3.2: Grant Kwala the AUTOMATION_ROLE

This is **CRITICAL** - Kwala needs permission to call contract functions.

```javascript
// In your browser console or Remix:
const poolAddress = "0xYOUR_POOL_ADDRESS";
const kwalaWalletAddress = "0xKWALA_AUTOMATION_WALLET"; // From Kwala dashboard

const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);
const AUTOMATION_ROLE = await pool.AUTOMATION_ROLE();

// Grant Kwala the automation role
await pool.grantRole(AUTOMATION_ROLE, kwalaWalletAddress);
```

Or add a button in your provider dashboard to grant roles.

#### Step 3.3: Add Backend API Endpoints for Kwala

Create these new endpoints in your backend:

```javascript
// backend/routes/kwalaRoutes.js
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

// Middleware to verify Kwala requests
const verifyKwala = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.KWALA_API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Endpoint 1: Review application
router.post('/review-application', verifyKwala, async (req, res) => {
  const { studentAddress, dataHash, poolAddress } = req.body;
  
  try {
    // 1. Fetch application from IPFS using dataHash
    const ipfsData = await fetchFromIPFS(dataHash);
    
    // 2. Check if student's email was verified
    const user = await User.findOne({ walletAddress: studentAddress });
    if (!user || !user.isEmailVerified) {
      return res.json({ status: 'rejected', reason: 'Email not verified' });
    }
    
    // 3. Apply your criteria (e.g., .edu email, GPA, etc.)
    if (!user.email.endsWith('.edu')) {
      return res.json({ status: 'rejected', reason: 'Not a .edu email' });
    }
    
    // 4. Approve!
    res.json({ status: 'approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Get approved students for payroll
router.post('/get-approved-students', verifyKwala, async (req, res) => {
  const { poolAddress, chainId } = req.body;
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    
    // Get all applicants
    const count = await pool.getApplicantCount();
    const students = [];
    
    for (let i = 0; i < count; i++) {
      const applicant = await pool.applicants(i);
      const app = await pool.applications(applicant);
      
      // Find approved but unpaid students
      if (app.isApproved && !app.isPaid) {
        students.push(applicant);
      }
    }
    
    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 3: Notify student of approval
router.post('/notify-student', verifyKwala, async (req, res) => {
  const { studentAddress, status, poolAddress } = req.body;
  
  // Send email to student
  const user = await User.findOne({ walletAddress: studentAddress });
  if (user) {
    await sendEmail(user.email, 'Application Approved!', 
      `Congratulations! Your scholarship application has been approved.`);
  }
  
  res.json({ success: true });
});

// Endpoint 4: Notify students of payment
router.post('/notify-payment', verifyKwala, async (req, res) => {
  const { students, poolAddress, txHash } = req.body;
  
  for (const studentAddr of students) {
    const user = await User.findOne({ walletAddress: studentAddr });
    if (user) {
      await sendEmail(user.email, 'Scholarship Paid!',
        `Your scholarship has been paid! Transaction: ${txHash}`);
    }
  }
  
  res.json({ success: true });
});

module.exports = router;
```

Add to your `backend/app.js`:
```javascript
const kwalaRoutes = require('./routes/kwalaRoutes');
app.use('/api/kwala', kwalaRoutes);
```

Add to your `backend/.env`:
```bash
KWALA_API_SECRET=generate_a_random_secret_here
```

#### Step 3.4: Configure Kwala Workflows

1. **In Kwala Dashboard**, create a new workflow
2. **Copy** the contents of `kwala-workflows/1-auto-review-workflow.yaml`
3. **Update** the following:
   - Replace `0xYOUR_SCHOLARSHIP_POOL_ADDRESS_HERE` with your pool address
   - Replace `https://your-backend.render.com` with your backend URL
   - Replace `YOUR_KWALA_API_SECRET` with the secret from your `.env`
   - Update `ChainID` if using Sepolia (11155111) instead of Mumbai (80001)
4. **Save and Deploy** the workflow

5. **Repeat** for workflow #2 (weekly payroll)

---

## 🧪 Testing Your Setup

### Test Workflow #1 (Auto-Review)

1. **As a Student**:
   - Register on your frontend
   - Verify email with OTP
   - Submit application to the test pool
   
2. **Watch the Magic**:
   - Check Kwala dashboard - you should see the workflow triggered
   - Application should be automatically verified and approved
   - Check blockchain explorer for transactions
   - Student should receive approval email

3. **Verify On-Chain**:
   ```bash
   cast call 0xYOUR_POOL_ADDRESS \
     "applications(address)(address,string,bool,bool,bool,uint256)" \
     0xSTUDENT_ADDRESS \
     --rpc-url https://rpc-mumbai.maticvigil.com
   ```
   Should show `isVerified: true` and `isApproved: true`

### Test Workflow #2 (Auto-Payroll)

For testing, you can temporarily change the cron schedule to run every minute:
```yaml
RepeatEvery: "* * * * *" # Every minute (for testing only!)
```

1. Ensure pool has funds
2. Ensure at least one student is approved but not paid
3. Wait for the cron to trigger
4. Check that student's wallet received funds
5. Check that `isPaid` is now `true`

---

## 🎯 Your Hackathon Pitch

> **"EduChain is the first fully automated, serverless scholarship platform."**
>
> **For Students**: Apply in 2 clicks. No gas fees. Instant approval. Automatic payments.
>
> **For Providers**: Create a pool, fund it, and walk away. Our system (powered by Kwala) handles:
> - ✅ Automatic application review
> - ✅ Email verification checks
> - ✅ Eligibility criteria validation
> - ✅ On-chain verification and approval
> - ✅ Scheduled weekly payments
> - ✅ Email notifications
>
> **All without the provider lifting a finger after setup.**

---

## 📊 Architecture Diagram

```
┌─────────────┐
│   Student   │
└──────┬──────┘
       │ 1. Submit application
       ▼
┌─────────────────────┐
│  Your Backend API   │ ◄──────┐
│ (Email + IPFS)      │        │
└──────┬──────────────┘        │
       │ 2. Upload to IPFS     │ 6. API calls
       │    Get hash            │    (review, notify)
       ▼                        │
┌─────────────────────┐        │
│  Backend calls      │        │
│  submitApplication()│        │
│  (gasless for user) │        │
└──────┬──────────────┘        │
       │                        │
       │ 3. Tx emits           │
       │    ApplicationSubmitted│
       ▼                        │
┌─────────────────────┐   ┌────┴──────┐
│ ScholarshipPool.sol │   │   Kwala   │
│ (On-Chain)          │◄──┤ Automation│
│                     │   │  Engine   │
│ - verifyApplication │   └───────────┘
│ - approveApplication│        ▲
│ - payScholarship    │        │
└─────────────────────┘        │ 5. Cron trigger
                               │    (weekly payroll)
```

---

## 🚨 Important Security Notes

1. **Use a Separate Automation Wallet**: Don't use your main wallet for Kwala
2. **Limit Role Permissions**: Kwala only has `AUTOMATION_ROLE`, not `ADMIN_ROLE`
3. **Secure Your API**: Use strong `KWALA_API_SECRET` and verify all requests
4. **Monitor Gas**: Kwala's wallet needs ETH/MATIC for gas - monitor balance
5. **Test on Testnet First**: Thoroughly test before mainnet deployment

---

## 🐛 Troubleshooting

### Kwala workflow not triggering
- Check that pool address is correct
- Verify ABI includes the event
- Ensure Kwala wallet is funded

### "AccessControl: account is missing role" error
- You forgot to grant `AUTOMATION_ROLE` to Kwala's wallet
- Run the `grantRole()` transaction

### Backend API not responding
- Check backend is deployed and running
- Verify `KWALA_API_SECRET` matches in both places
- Check Kwala dashboard logs for error details

### Payments not going through
- Check pool has sufficient funds
- Verify students are `isApproved: true` and `isPaid: false`
- Check Kwala wallet has gas tokens

---

## 📚 Next Steps

1. ✅ Deploy contract (Phase 1)
2. ✅ Create test pool (Phase 2)
3. ⏳ Set up Kwala workflows (Phase 3)
4. 🧪 Test with real applications
5. 🎨 Polish frontend UI
6. 📹 Record demo video for hackathon
7. 🚀 Deploy to mainnet (optional)

---

## 🏆 Why This Wins Hackathons

- **Innovation**: First automated scholarship platform using Kwala
- **Real Problem**: Solves actual pain point (manual admin overhead)
- **Technical Depth**: Smart contracts + Backend + Automation + IPFS
- **User Experience**: Gasless applications, instant approvals, auto-payments
- **Scalability**: Works for 1 student or 1,000 students
- **Complete**: End-to-end working prototype

**Good luck with your hackathon! 🚀**
