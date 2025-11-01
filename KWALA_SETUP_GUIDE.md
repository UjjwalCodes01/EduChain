# 🚀 KWALA Setup Guide for EduChain

## 📋 Prerequisites

Before using KWALA, you need:
1. ✅ **KALP Wallet** account
2. ✅ **KWALA Address** (auto-generated from KALP Wallet)
3. ✅ **USDT** to purchase KWALA credits
4. ✅ **Deployed ScholarshipPool contract** on Mumbai/Sepolia

---

## 🔑 Step 1: Get Your KWALA Address

Your KWALA address is automatically generated from your KALP Wallet:

**Format:**
```
Your KALP Wallet: 0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234
Your KWALA Address: KWL-0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234-CC
```

**How to Get It:**
1. Create KALP Wallet: https://kalp.studio/
2. Your KWALA address appears in your wallet dashboard
3. **Save this address** - you'll need it to grant permissions

---

## 💰 Step 2: Purchase KWALA Credits

KWALA uses a **credit-based system** for workflow execution:

1. **Go to KALP Wallet**
2. **Send USDT** to your KWALA address
3. **Credits are added instantly**
4. **Credits deducted** per workflow execution

**Pricing Info:**
- Each workflow action consumes credits
- Event-triggered workflows: ~X credits per trigger
- Time-based workflows: ~X credits per execution
- Failed workflows may consume minimal credits

💡 **Pro Tip:** Keep credits topped up to ensure uninterrupted automation!

---

## 🔐 Step 3: Grant AUTOMATION_ROLE to KWALA

**Critical Step:** Your ScholarshipPool contract must grant the `AUTOMATION_ROLE` to your KWALA wallet address (not the KWL- address, just the 0x address).

### Method 1: Using Remix IDE

1. **Open Remix:** https://remix.ethereum.org/
2. **Load Your Contract:**
   - Paste `ScholarshipPool.sol` into Remix
   - Compile with Solidity 0.8.19+
3. **Connect MetaMask:**
   - Switch to Mumbai/Sepolia network
   - Click "Deploy & Run Transactions"
   - Select "Injected Provider - MetaMask"
4. **Load Your Deployed Contract:**
   - Choose "At Address"
   - Paste your pool address: `0xYOUR_POOL_ADDRESS`
5. **Grant Role:**
   ```solidity
   // 1. Get AUTOMATION_ROLE hash
   AUTOMATION_ROLE() → returns: 0xabc123... (copy this)
   
   // 2. Extract wallet address from KWALA address
   // If KWALA address is: KWL-0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234-CC
   // Use wallet address: 0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234
   
   // 3. Grant role
   grantRole(bytes32 role, address account)
   role: 0xabc123... (from step 1)
   account: 0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234
   
   // 4. Click "transact" and confirm in MetaMask
   ```

### Method 2: Using Foundry Cast

```bash
# Get AUTOMATION_ROLE hash
cast call 0xYOUR_POOL_ADDRESS \
  "AUTOMATION_ROLE()(bytes32)" \
  --rpc-url https://rpc-mumbai.maticvigil.com

# Output: 0xabc123...

# Grant role (replace with your values)
cast send 0xYOUR_POOL_ADDRESS \
  "grantRole(bytes32,address)" \
  0xabc123... \
  0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234 \
  --rpc-url https://rpc-mumbai.maticvigil.com \
  --private-key YOUR_PRIVATE_KEY

# Verify role granted
cast call 0xYOUR_POOL_ADDRESS \
  "hasRole(bytes32,address)(bool)" \
  0xabc123... \
  0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234 \
  --rpc-url https://rpc-mumbai.maticvigil.com

# Output: true ✅
```

### Method 3: Add to Frontend (Best for Providers)

Add a "Enable Automation" button in your provider dashboard:

```typescript
const enableKwalaAutomation = async (poolAddress: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);
  
  // Your KWALA wallet address (extracted from KWL-...-CC format)
  const kwalaWalletAddress = "0x742d35Cc6e9A5f1e7A0e6FD4C8b2Bc3F5d9E1234";
  
  const AUTOMATION_ROLE = await pool.AUTOMATION_ROLE();
  const tx = await pool.grantRole(AUTOMATION_ROLE, kwalaWalletAddress);
  await tx.wait();
  
  toast.success("Automation enabled! KWALA will now handle approvals and payments.");
};
```

---

## 📝 Step 4: Update Workflow Files

Before uploading to KWALA dashboard, update these values in both workflow files:

### In `1-auto-review-workflow.yaml`:
```yaml
# Line 9: Update pool address
TriggerSourceContract: "0xYOUR_DEPLOYED_POOL_ADDRESS"

# Line 18: Update backend URL
APIEndpoint: "https://your-backend.onrender.com/api/kwala/review-application"

# Line 26, 35, 44: Update pool addresses
TargetContract: "0xYOUR_DEPLOYED_POOL_ADDRESS"

# Line 29, 38: Update chain ID if Sepolia
ChainID: 11155111  # For Sepolia (80001 for Mumbai)
```

### In `2-weekly-payroll-workflow.yaml`:
```yaml
# Line 13: Update chain ID if needed
RecurringChainID: 80001  # Mumbai (11155111 for Sepolia)

# Line 20: Update pool address and backend
APIPayload: '{"poolAddress": "0xYOUR_POOL_ADDRESS", "chainId": 80001}'

# Line 27, 36, 43: Update pool addresses
TargetContract: "0xYOUR_POOL_ADDRESS"
```

---

## 📤 Step 5: Upload Workflows to KWALA

1. **Login to KWALA Dashboard:** https://kwala.network/dashboard
2. **Create New Workflow:**
   - Click "Create Workflow"
   - Select "Import from YAML"
3. **Upload Workflow #1:**
   - Paste contents of `1-auto-review-workflow.yaml`
   - Click "Validate" to check for errors
   - Click "Deploy Workflow"
4. **Repeat for Workflow #2:**
   - Upload `2-weekly-payroll-workflow.yaml`
   - Validate and deploy

---

## ✅ Step 6: Test Your Automation

### Test Workflow #1 (Auto-Review):
```bash
# 1. Submit an application as a student (via your frontend)
# 2. Check KWALA dashboard - should see workflow triggered
# 3. Check blockchain - application should be verified & approved
# 4. Check email - student should receive notification
```

### Test Workflow #2 (Auto-Payroll):
```yaml
# For testing, temporarily change cron schedule:
RepeatEvery: "*/5 * * * *"  # Every 5 minutes

# After testing, change back to:
RepeatEvery: "0 17 * * 5"   # Every Friday at 5 PM
```

---

## 🔍 Monitoring & Debugging

### Check Workflow Execution:
1. **KWALA Dashboard:** View execution logs and credit usage
2. **Blockchain Explorer:** Verify transactions on Mumbai/Sepolia
3. **Backend Logs:** Check API endpoint calls
4. **Email:** Confirm notifications sent

### Common Issues:

| Issue | Solution |
|-------|----------|
| Workflow not triggering | Check contract address and event ABI |
| "Missing role" error | Grant `AUTOMATION_ROLE` to KWALA wallet |
| API call fails | Verify backend URL and endpoint is live |
| Out of credits | Recharge KWALA address with USDT |
| Transaction reverts | Check pool has sufficient funds |

---

## 💡 Best Practices

1. ✅ **Test on testnet first** (Mumbai/Sepolia)
2. ✅ **Start with small credit amount** for testing
3. ✅ **Monitor credit usage** regularly
4. ✅ **Set up low balance alerts**
5. ✅ **Keep backend API endpoints secure**
6. ✅ **Test workflows with small batches** before going live
7. ✅ **Document your KWALA address** securely

---

## 📊 Workflow Cost Estimation

**Workflow #1 (Event-Driven):**
- Triggered per application submitted
- ~X credits per execution
- 4 actions per execution

**Workflow #2 (Time-Based):**
- Runs once per week
- ~X credits per execution
- 4 actions per execution

**Monthly Estimate:**
- 100 applications/month: ~X credits
- 4 payroll runs/month: ~X credits
- **Total: ~X credits/month**

💰 **Keep 2-3 months of credits** as buffer

---

## 🎯 Next Steps

1. ✅ Create KALP Wallet account
2. ✅ Get KWALA address
3. ✅ Purchase initial credits (test amount)
4. ✅ Deploy ScholarshipPool contract
5. ✅ Grant AUTOMATION_ROLE to KWALA
6. ✅ Update workflow YAML files
7. ✅ Upload workflows to KWALA dashboard
8. ✅ Test with real transactions
9. ✅ Monitor and optimize

---

## 📚 Resources

- **KWALA Docs:** https://docs.kwala.network/
- **KALP Wallet:** https://kalp.studio/
- **KWALA Dashboard:** https://kwala.network/dashboard
- **Support:** https://discord.gg/kwala

---

**You're now ready to automate your scholarship platform with KWALA!** 🚀
