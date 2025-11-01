# ✅ KWALA Workflows Updated!

## 📋 Summary of Changes

Both workflow files have been updated to be **KWALA-compliant** and ready for Sepolia testnet deployment.

---

## 🔧 **Key Changes Made**

### **1. Variable Syntax (CRITICAL FIX)**

| Old (Wrong) | New (Correct) | Usage |
|-------------|---------------|-------|
| `{{Trigger.student}}` | `{{event.student}}` | Event data from trigger |
| `{{Trigger.dataHash}}` | `{{event.dataHash}}` | Event data from trigger |
| `{{Trigger.address}}` | `{{contract.address}}` | Contract that emitted event |

### **2. Network Configuration**

- ✅ Changed from Mumbai (80001) to **Sepolia (11155111)**
- ✅ Updated RPC references to Sepolia
- ✅ All ChainID fields set to 11155111

### **3. API Payload Format**

- ✅ Changed from single-line JSON strings to **multi-line YAML** format
- ✅ Better readability and easier to edit
- ✅ Proper JSON formatting inside YAML

**Old:**
```yaml
APIPayload: '{"studentAddress": "{{Trigger.student}}"}'
```

**New:**
```yaml
APIPayload: |
  {
    "studentAddress": "{{event.student}}",
    "poolAddress": "{{contract.address}}"
  }
```

### **4. Target Parameters**

- ✅ Changed from JSON strings to **YAML arrays**
- ✅ Removed quotes around array syntax

**Old:**
```yaml
TargetParams: '["{{Trigger.student}}"]'
```

**New:**
```yaml
TargetParams: ["{{event.student}}"]
```

### **5. Dynamic Contract Addresses**

- ✅ Workflow #1: Uses `{{contract.address}}` (pool that emitted event)
- ✅ Workflow #2: Uses `{{GetApprovedStudentsList.poolAddress}}` (from API response)

### **6. EncodedABI Field**

- ✅ Changed from function signature to placeholder `"0x"`
- ✅ KWALA will auto-generate the ABI encoding

### **7. Backend URLs**

- ✅ Updated placeholder from `your-backend.onrender.com` to `your-backend-url.com`
- ✅ More generic, easier to find and replace

### **8. PoolFactory Integration (Workflow #2)**

- ✅ Now queries PoolFactory at deployed address: `0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a`
- ✅ Backend returns which pool to pay and which students

---

## 📁 **Updated Files**

1. ✅ **`kwala-workflows/1-auto-review-workflow.yaml`**
   - Event-driven: Triggers on `ApplicationSubmitted`
   - Auto-reviews and approves applications
   - Sends email notifications

2. ✅ **`kwala-workflows/2-weekly-payroll-workflow.yaml`**
   - Time-driven: Runs every Friday at 5 PM UTC
   - Batch pays all approved students
   - Sends payment confirmations

---

## 🎯 **What You Need to Do Before Using**

### **For Both Workflows:**

1. **Deploy Backend Publicly**
   ```bash
   # Option A: Ngrok (quick test)
   ngrok http 5000
   
   # Option B: Render/Railway (production)
   # Deploy via dashboard
   ```

2. **Update Backend URL**
   - Find: `https://your-backend-url.com`
   - Replace with your actual URL (e.g., `https://educhain-api.onrender.com`)

3. **Get KWALA Wallet Address**
   - Login to KWALA dashboard
   - Copy your wallet address (format: `KWL-0xAddress-CC`)
   - Extract ETH address: `0xAddress`

4. **Fund KWALA Wallet**
   ```bash
   # Send Sepolia ETH for gas
   cast send KWALA_ETH_ADDRESS \
     --value 0.05ether \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh \
     --private-key YOUR_PRIVATE_KEY
   ```

5. **Purchase KWALA Credits**
   - Go to KWALA dashboard → Recharge
   - Send USDT to get credits

---

### **For Workflow #1 (Auto-Review):**

6. **Create a Pool**
   ```bash
   # Via frontend or:
   cast send 0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a \
     "createPool(string,string,uint256,uint256)" \
     "Test Pool" \
     "Test Description" \
     10000000000000000 \
     1735689600 \
     --value 0.1ether \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh \
     --private-key YOUR_PRIVATE_KEY
   ```

7. **Update Workflow File**
   - Find: `0xYOUR_POOL_ADDRESS_HERE`
   - Replace with your pool address from step 6

8. **Grant AUTOMATION_ROLE**
   ```bash
   # Get role hash
   ROLE=$(cast call POOL_ADDRESS "AUTOMATION_ROLE()(bytes32)" \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh)
   
   # Grant role
   cast send POOL_ADDRESS \
     "grantRole(bytes32,address)" \
     $ROLE \
     KWALA_ETH_ADDRESS \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh \
     --private-key YOUR_PRIVATE_KEY
   ```

---

### **For Workflow #2 (Weekly Payroll):**

9. **Grant AUTOMATION_ROLE on ALL Pools**
   - Repeat step 8 for every pool you create
   - KWALA needs permission to call `batchPayScholarships()`

10. **Ensure Pools Have Funds**
    ```bash
    # Check pool balance
    cast balance POOL_ADDRESS \
      --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
    
    # Fund if needed
    cast send POOL_ADDRESS \
      --value 0.5ether \
      --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh \
      --private-key YOUR_PRIVATE_KEY
    ```

---

## 🚀 **Upload to KWALA Dashboard**

1. **Login to KWALA**
   - Visit KWALA dashboard
   - Connect your KALP wallet

2. **Create Workflow #1**
   - Click "Create Workflow"
   - Copy/paste contents of `1-auto-review-workflow.yaml`
   - Or upload the file directly
   - Click "Deploy"

3. **Create Workflow #2**
   - Same process for `2-weekly-payroll-workflow.yaml`
   - Click "Deploy"

4. **Test Workflows**
   - Workflow #1: Submit a test application
   - Workflow #2: Click "Manual Trigger" in dashboard

---

## ✅ **Checklist Before Going Live**

- [ ] Backend deployed publicly and accessible
- [ ] Backend URL updated in both workflow files
- [ ] KWALA wallet address obtained
- [ ] KWALA wallet funded with Sepolia ETH (min 0.05 ETH)
- [ ] KWALA credits purchased
- [ ] At least one scholarship pool created
- [ ] Pool address updated in Workflow #1
- [ ] AUTOMATION_ROLE granted to KWALA on all pools
- [ ] All pools have sufficient balance for payments
- [ ] Both workflows uploaded to KWALA dashboard
- [ ] Test application submitted successfully
- [ ] Workflow #1 auto-approved the application
- [ ] Workflow #2 tested with manual trigger

---

## 📊 **Expected Workflow Behavior**

### **Workflow #1 (Real-time):**

```
Student Submits Application
    ↓
Event: ApplicationSubmitted fires
    ↓
KWALA detects event
    ↓
Action 1: Backend reviews IPFS data
    ↓
Action 2: verifyApplication() called
    ↓
Action 3: approveApplication() called
    ↓
Action 4: Email sent to student
    ↓
✅ Student approved in ~30 seconds!
```

### **Workflow #2 (Weekly):**

```
Friday 5 PM UTC
    ↓
KWALA cron triggers
    ↓
Action 1: Backend returns approved students
    ↓
Action 2: batchPayScholarships() called
    ↓
Action 3: Emails sent to all students
    ↓
Action 4: Payroll logged
    ↓
✅ All students paid automatically!
```

---

## 🐛 **Troubleshooting**

| Error | Cause | Solution |
|-------|-------|----------|
| "Variable not found: {{event.student}}" | Old syntax used | Re-upload updated YAML |
| "Access denied" | Missing AUTOMATION_ROLE | Grant role to KWALA wallet |
| "Insufficient funds" | Low balance | Fund KWALA wallet with ETH |
| "API call failed" | Backend unreachable | Check backend URL, ensure public |
| "Transaction reverted" | Pool has no balance | Fund the pool contract |

---

## 📚 **Additional Resources**

- **Deployment Guide:** `DEPLOYMENT_SUCCESS.md`
- **KWALA Setup:** `KWALA_SETUP_GUIDE.md`
- **Backend Routes:** `backend/routes/kwalaRoutes.js`
- **Contract ABIs:** `frontend/lib/contracts.ts`

---

**Your workflows are now ready! Follow the checklist above to deploy them.** 🎉

Questions? Check the setup instructions in each YAML file!
