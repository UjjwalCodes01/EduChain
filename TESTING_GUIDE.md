# End-to-End Testing Guide

Complete manual testing workflow for EduChain scholarship platform.

---

## Prerequisites

✅ MongoDB Atlas connected to backend  
✅ Backend deployed on Render  
✅ Frontend deployed on Vercel (or running locally)  
✅ MetaMask installed with Sepolia testnet  
✅ Test ETH in wallet (get from https://sepoliafaucet.com)  

---

## Test Environment Setup

### 1. Prepare Test Wallets

You need 3 test wallets:

**Admin Wallet** (Pool Creator)
- Address: Your main MetaMask account
- Role: Create pool, approve applications, send payments
- Needs: 0.1+ ETH for gas fees

**Student Wallet 1**
- Address: Create a new account in MetaMask
- Role: Submit application
- Needs: 0.01 ETH for gas fees

**Student Wallet 2**
- Address: Create another account in MetaMask
- Role: Submit second application (for batch testing)
- Needs: 0.01 ETH for gas fees

### 2. Get Sepolia Test ETH

Visit: https://sepoliafaucet.com
- Connect wallet
- Request 0.5 ETH
- Wait 30 seconds
- Repeat for all 3 wallets

### 3. Set Admin Role on Contract

From terminal (contracts directory):

```bash
cd contracts

# Grant ADMIN_ROLE to your wallet
cast send 0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE \
  "grantRole(bytes32,address)" \
  "0x0000000000000000000000000000000000000000000000000000000000000000" \
  "YOUR_ADMIN_WALLET_ADDRESS" \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh \
  --private-key YOUR_PRIVATE_KEY
```

**Note**: `0x0000...0000` is DEFAULT_ADMIN_ROLE hash

---

## Testing Workflow

## Phase 1: Provider Registration & Pool Creation

### Test 1.1: Provider Registration

1. **Connect Wallet** (Admin)
   - Open app: https://edu-chain-zeta.vercel.app/ (or localhost:3000)
   - Click "Connect Wallet"
   - Select MetaMask
   - Approve connection
   - ✅ Wallet address should appear in header

2. **Register as Provider**
   - Click "Profile" or "Register"
   - Select role: **Provider**
   - Fill in:
     - Name: "Test University"
     - Email: your-email@example.com
     - Organization: "Test University Foundation"
   - Submit form
   - ✅ Should redirect to home page
   - ✅ Role saved in localStorage

3. **Verify Backend Registration**
   - Check backend logs on Render
   - ✅ Should see: "User registered successfully"
   - ✅ MongoDB should have user record

### Test 1.2: Create Scholarship Pool

1. **Navigate to Create Pool**
   - Click "Create Pool" in navigation
   - Fill in pool details:
     ```
     Pool Name: Computer Science Scholarship 2025
     Description: For outstanding CS students
     Scholarship Amount: 0.05 ETH
     Number of Recipients: 3
     Application Deadline: [Select future date]
     Eligibility: GPA > 3.5, CS major
     ```

2. **Initial Deposit**
   - Enter: 0.2 ETH (covers 4 scholarships for safety)
   - Click "Create Pool"
   - ✅ MetaMask popup appears
   - ✅ Gas estimate shows (~0.01 ETH)
   - Confirm transaction

3. **Wait for Confirmation**
   - ✅ Loading indicator appears
   - ✅ Transaction hash shown
   - ✅ Success message after ~15 seconds
   - ✅ Pool address displayed

4. **Verify Pool Creation**
   ```bash
   # Check pool count
   cast call 0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a \
     "getPoolCount()(uint256)" \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
   
   # Should return: 1 (or higher)
   ```

5. **View Pool Details**
   - Navigate to "My Pools"
   - ✅ New pool should appear
   - ✅ Shows correct name, amount, balance
   - ✅ Click to view full details

---

## Phase 2: Student Application Flow

### Test 2.1: Student Registration

1. **Switch to Student Wallet 1**
   - In MetaMask, switch to student account
   - Refresh page
   - Click "Connect Wallet"
   - ✅ New wallet address in header

2. **Register as Student**
   - Click "Profile" or "Register"
   - Select role: **Student**
   - Fill in:
     - Name: "Alice Johnson"
     - Email: alice@university.edu
     - Student ID: "CS2024001"
     - Institution: "Test University"
   - Submit
   - ✅ Registration successful

### Test 2.2: Browse Pools

1. **View Available Pools**
   - Navigate to "Browse Pools" or home page
   - ✅ Should see "Computer Science Scholarship 2025"
   - Click on pool card

2. **Check Pool Details**
   - ✅ Scholarship amount: 0.05 ETH
   - ✅ Available spots: 3
   - ✅ Deadline displayed correctly
   - ✅ "Apply Now" button visible

### Test 2.3: Submit Application

1. **Fill Application Form**
   ```
   Program: Computer Science
   Year of Study: 3rd Year
   GPA: 3.8
   Statement of Purpose:
   "I am passionate about blockchain technology and decentralized 
   systems. This scholarship will help me complete my final year 
   project on smart contract security..."
   ```

2. **Upload Documents** (if required)
   - Upload: transcript.pdf
   - ✅ File upload progress shown
   - ✅ IPFS hash generated

3. **Submit to Blockchain**
   - Click "Submit Application"
   - ✅ MetaMask popup appears
   - Review transaction details
   - Confirm transaction
   - ✅ Loading indicator shown
   - Wait ~15 seconds

4. **Email Verification**
   - ✅ Success message: "Application submitted!"
   - ✅ "Please verify your email" prompt
   - Check email inbox for verification code
   - Enter OTP code
   - ✅ "Email verified successfully"

5. **Verify Application on Blockchain**
   ```bash
   cast call 0xYOUR_POOL_ADDRESS \
     "getApplicant(address)(bool)" \
     "STUDENT_WALLET_1_ADDRESS" \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
   
   # Should return: true
   ```

6. **Check Application Status**
   - Navigate to "My Applications"
   - ✅ Application appears with status: "Pending Review"
   - ✅ Shows pool name, amount, date submitted

### Test 2.4: Submit Second Application

1. **Switch to Student Wallet 2**
   - Change MetaMask account
   - Repeat registration (Bob Smith, bob@university.edu)
   - Submit application with different details
   - ✅ Email verified

---

## Phase 3: Admin Review & Approval

### Test 3.1: Access Admin Dashboard

1. **Switch to Admin Wallet**
   - Change MetaMask to admin account
   - Navigate to "Admin Dashboard"
   - ✅ Dashboard loads successfully

2. **View Applications**
   - ✅ Shows 2 applications in "Pending Review"
   - ✅ Filter options visible:
     - By Pool
     - By Status (Pending, Approved, Rejected, Paid)
   - ✅ Statistics panel shows correct counts

### Test 3.2: Review Application Details

1. **Open Application 1 (Alice)**
   - Click on Alice's application row
   - ✅ Modal/detail view opens
   - Verify details:
     - ✅ Applicant wallet address
     - ✅ Student name, email, ID
     - ✅ GPA: 3.8
     - ✅ Statement displayed
     - ✅ Email verified: ✓
     - ✅ Documents link (if uploaded)

2. **Review Documents**
   - Click "View Documents"
   - ✅ Opens IPFS link in new tab
   - ✅ PDF loads correctly

### Test 3.3: Approve Application

1. **Approve Alice's Application**
   - In application detail modal
   - Click "✓ Approve Application"
   - ✅ Confirmation prompt appears
   - Confirm approval
   - ✅ Backend processes approval
   - ✅ Success message: "Application approved"
   - ✅ Status changes to "Approved"

2. **Verify Approval in Backend**
   - Check Render logs
   - ✅ Log: "Application approved successfully"
   - Check MongoDB
   - ✅ `adminApproved: true` in database

3. **Verify Approval on Blockchain**
   ```bash
   cast call 0xYOUR_POOL_ADDRESS \
     "getApplication(address)(uint8)" \
     "ALICE_WALLET_ADDRESS" \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
   
   # Should return: 2 (Approved status)
   ```

### Test 3.4: Reject Application

1. **Reject Bob's Application**
   - Open Bob's application
   - Click "✗ Reject Application"
   - ✅ Rejection reason modal appears
   - Enter reason: "GPA below minimum requirement"
   - Confirm rejection
   - ✅ Status changes to "Rejected"

2. **Verify Student Notification**
   - Switch to Bob's wallet
   - Check "My Applications"
   - ✅ Shows "Rejected" status
   - ✅ Rejection reason displayed

---

## Phase 4: Payment Processing

### Test 4.1: Single Payment

1. **Navigate to Approved Applications**
   - In admin dashboard
   - Filter: Status = "Approved"
   - ✅ Alice's application appears

2. **Initiate Blockchain Payment**
   - Click on Alice's application
   - Click "💸 Pay on Blockchain"
   - ✅ MetaMask popup appears
   - Review transaction:
     - To: Pool contract address
     - Value: 0 ETH (amount is from pool balance)
     - Gas: ~0.002 ETH
   - Confirm transaction

3. **Wait for Confirmation**
   - ✅ Loading: "Waiting for transaction confirmation..."
   - ✅ Success: "Payment sent on blockchain!"
   - ✅ Auto-marks as paid in backend
   - ✅ Status changes to "Paid"

4. **Verify Student Received Payment**
   - Switch to Alice's wallet
   - Check balance in MetaMask
   - ✅ Balance increased by 0.05 ETH
   - Check "My Applications"
   - ✅ Status shows "Paid" with transaction hash

5. **Verify on Blockchain**
   ```bash
   # Check if recipient is marked as paid
   cast call 0xYOUR_POOL_ADDRESS \
     "recipients(address)(bool)" \
     "ALICE_WALLET_ADDRESS" \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
   
   # Should return: true
   ```

6. **Check Pool Stats**
   ```bash
   cast call 0xYOUR_POOL_ADDRESS \
     "getPoolStats()(uint256,uint256,uint256,uint256,uint256,uint256)" \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
   
   # Returns: totalFunds, availableFunds, scholarshipsAwarded, applicantCount, amount, deadline
   # availableFunds should be: 0.15 ETH (0.2 - 0.05)
   # scholarshipsAwarded should be: 1
   ```

### Test 4.2: Batch Payment (Multiple Recipients)

1. **Approve More Applications**
   - Submit 2 more applications from different wallets
   - Approve both in admin dashboard
   - ✅ Both show "Approved" status

2. **Select Multiple Applications**
   - In admin dashboard
   - Check checkboxes for both approved applications
   - ✅ Selection counter updates: "2 application(s) selected"
   - ✅ "💸 Pay Selected on Blockchain" button appears

3. **Initiate Batch Payment**
   - Click "💸 Pay Selected on Blockchain"
   - ✅ MetaMask popup for batch transaction
   - Review:
     - Function: `batchPayScholarships`
     - Gas: ~0.004 ETH (higher for batch)
   - Confirm transaction

4. **Wait for Batch Confirmation**
   - ✅ Loading: "Processing 2 payment(s)..."
   - ✅ Success: "2 payment(s) sent!"
   - ✅ Both marked as paid automatically

5. **Verify All Recipients**
   - Check both student wallets
   - ✅ Each received 0.05 ETH
   - Check pool stats:
   ```bash
   cast call 0xYOUR_POOL_ADDRESS \
     "getPoolStats()(uint256,uint256,uint256,uint256,uint256,uint256)" \
     --rpc-url https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
   
   # scholarshipsAwarded should be: 3 (1 + 2)
   # availableFunds should be: 0.05 ETH (0.2 - 0.15)
   ```

---

## Phase 5: Transaction History

### Test 5.1: View All Transactions

1. **Admin Transaction History**
   - Click "📊 Transactions" in navigation
   - ✅ Shows all transactions:
     - Pool creation (0.2 ETH deposit)
     - 3 scholarship payments (0.05 ETH each)
   - ✅ Each shows: date, amount, type, tx hash

2. **Student Transaction History**
   - Switch to Alice's wallet
   - Navigate to "Transactions"
   - ✅ Shows scholarship payment received
   - ✅ Click tx hash → opens Etherscan

3. **Verify on Etherscan**
   - Visit: https://sepolia.etherscan.io
   - Search pool contract address
   - ✅ Shows all transactions
   - ✅ Internal transactions show ETH transfers to students

---

## Phase 6: Edge Cases & Error Handling

### Test 6.1: Insufficient Pool Funds

1. **Try to Pay Beyond Balance**
   - Approve 10 more applications (if possible)
   - Try to pay all at once
   - ✅ Transaction should revert
   - ✅ Error: "Insufficient pool balance"

### Test 6.2: Duplicate Application

1. **Submit Same Application Twice**
   - As student, submit application to same pool
   - ✅ Error: "Already applied to this pool"

### Test 6.3: Unauthorized Admin Actions

1. **Try Admin Actions from Student Wallet**
   - Switch to student wallet
   - Try to access /admin
   - ✅ Redirected with error: "Access denied"

2. **Try to Approve Without ADMIN_ROLE**
   - Use wallet without admin role
   - Try to call approveApplication
   - ✅ Transaction reverts: "Missing required role"

### Test 6.4: Network Issues

1. **Disconnect Internet**
   - Try to submit application
   - ✅ Error: "Network error, please try again"

2. **Switch to Wrong Network**
   - Change MetaMask to Ethereum mainnet
   - Try to interact
   - ✅ Prompt: "Please switch to Sepolia testnet"
   - ✅ "Switch Network" button appears

### Test 6.5: MetaMask Rejection

1. **Reject Transaction**
   - Start any blockchain action
   - Click "Reject" in MetaMask
   - ✅ Error: "Transaction rejected by user"
   - ✅ No state changes

---

## Phase 7: Performance & UX Testing

### Test 7.1: Loading States

1. **Check Loading Indicators**
   - During application submission
   - ✅ Button shows "Submitting..."
   - ✅ Loading spinner visible
   - During payment
   - ✅ "Processing payment..." message

2. **Check Empty States**
   - New pool with no applications
   - ✅ Shows: "No applications yet"
   - Student with no applications
   - ✅ Shows: "You haven't applied to any pools"

### Test 7.2: Responsive Design

1. **Test Mobile View**
   - Open on mobile device or resize browser
   - ✅ Navigation menu collapses to hamburger
   - ✅ Forms are scrollable
   - ✅ Tables adapt to small screen

2. **Test Tablet View**
   - ✅ Layout adjusts appropriately
   - ✅ All buttons accessible

### Test 7.3: Browser Compatibility

Test on:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari (if on Mac)
- ✅ Brave

---

## Testing Checklist

### Backend API
- [ ] User registration (student & provider)
- [ ] OTP email sending
- [ ] OTP verification
- [ ] Application submission
- [ ] Application retrieval
- [ ] Admin approval
- [ ] Admin rejection
- [ ] Mark as paid
- [ ] Batch operations
- [ ] Statistics endpoint
- [ ] Error handling

### Smart Contracts
- [ ] Pool creation
- [ ] Initial deposit
- [ ] Application submission
- [ ] Application verification
- [ ] Application approval
- [ ] Application rejection
- [ ] Single payment
- [ ] Batch payment
- [ ] Pool stats retrieval
- [ ] Access control (roles)
- [ ] Event emissions

### Frontend
- [ ] Wallet connection
- [ ] Network detection
- [ ] Pool creation UI
- [ ] Application form
- [ ] File upload (IPFS)
- [ ] Admin dashboard
- [ ] Application filtering
- [ ] Approval workflow
- [ ] Payment workflow
- [ ] Transaction history
- [ ] Error messages
- [ ] Success notifications
- [ ] Loading states
- [ ] Mobile responsiveness

### Integration
- [ ] Backend ↔ MongoDB
- [ ] Frontend ↔ Backend API
- [ ] Frontend ↔ Smart contracts
- [ ] Smart contracts ↔ Blockchain
- [ ] Email delivery
- [ ] IPFS file storage

---

## Bug Reporting Template

If you find issues, document them:

```markdown
**Bug**: [Brief description]

**Steps to Reproduce**:
1. Navigate to...
2. Click on...
3. Enter...
4. Observe...

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happened]

**Environment**:
- Browser: Chrome 120
- Wallet: MetaMask 11.5
- Network: Sepolia
- Device: Desktop/Mobile

**Console Errors**: [Any error messages]

**Screenshots**: [If applicable]
```

---

## Success Criteria

All tests pass when:

✅ **Registration**: Students and providers can register  
✅ **Pool Creation**: Providers can create pools with initial deposit  
✅ **Applications**: Students can submit and verify applications  
✅ **Admin Review**: Admins can approve/reject applications  
✅ **Payments**: Single and batch payments work correctly  
✅ **Blockchain Sync**: All states match between backend and blockchain  
✅ **Error Handling**: Appropriate errors shown for all failure cases  
✅ **Performance**: All actions complete within reasonable time (<30s)  
✅ **UX**: Interface is intuitive and responsive  

---

🎉 **Testing Complete!**

Next steps:
1. Document any bugs found
2. Fix critical issues
3. Optimize gas usage if needed
4. Add more test coverage
5. Prepare for mainnet deployment (when ready)
