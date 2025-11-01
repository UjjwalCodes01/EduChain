# Frontend Deployment Guide

## ⚠️ CRITICAL: Fix Required Before Deployment

Your frontend has **32+ hardcoded `http://localhost:5000` URLs** that need to be replaced with environment variables.

## Status: 🔴 NOT READY (Configuration Needed)

---

## Issues Found

### 1. Hardcoded Backend URLs
Multiple files contain hardcoded localhost URLs:
- ✅ `components/ApplicationModal.tsx` - **FIXED**
- ✅ `components/OTPModal.tsx` - **FIXED**
- ❌ `app/admin/page.tsx` - 7 instances
- ❌ `app/Home/page.tsx` - 2 instances
- ❌ `app/my-applications/page.tsx` - 2 instances
- ❌ `app/my-pools/page.tsx` - 1 instance
- ❌ `app/details/page.tsx` - 2 instances
- ❌ `app/transactions/page_old_backup.tsx` - 2 instances

### 2. Environment Configuration Created
✅ Created `.env.local` with `NEXT_PUBLIC_API_URL`
✅ Created `lib/api.ts` with centralized API endpoints
✅ Created `.env.example` for documentation

---

## Remaining Tasks

### Step 1: Update All Frontend Files

You need to update the following files to use the new API configuration:

#### Files to Update:
1. `app/admin/page.tsx`
2. `app/Home/page.tsx`
3. `app/my-applications/page.tsx`
4. `app/my-pools/page.tsx`
5. `app/details/page.tsx`

#### Pattern to Follow:

**BEFORE:**
```typescript
const response = await fetch("http://localhost:5000/api/applications/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

**AFTER:**
```typescript
import { API_ENDPOINTS } from "@/lib/api";

const response = await fetch(API_ENDPOINTS.SUBMIT_APPLICATION, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

### Step 2: Test Locally

After updating all files:

```bash
cd frontend
npm run build
npm start
```

Test all features to ensure nothing broke:
- ✅ Create pool
- ✅ Submit application
- ✅ OTP verification
- ✅ Admin approval
- ✅ View transactions

---

## Deployment Instructions (After Fixes)

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variable:**
   In Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.onrender.com`
   - Redeploy: `vercel --prod`

### Option B: Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=.next
   ```

4. **Set Environment Variable:**
   In Netlify Dashboard:
   - Site settings → Environment variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.onrender.com`

---

## Environment Variables for Production

Create these in your deployment platform:

```env
# Backend API URL (REQUIRED)
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com

# The NEXT_PUBLIC_ prefix makes it available in the browser
```

⚠️ **Important:** After deploying backend to Render with MongoDB Atlas, update this URL!

---

## Verification Checklist

Before going live:

- [ ] All `localhost:5000` replaced with `API_ENDPOINTS` imports
- [ ] Local build succeeds (`npm run build`)
- [ ] Local production test works (`npm start`)
- [ ] Environment variable set in deployment platform
- [ ] Backend is deployed and accessible (test `/health` endpoint)
- [ ] MongoDB Atlas connected to backend
- [ ] Test wallet connection on live site
- [ ] Test creating a pool
- [ ] Test submitting application
- [ ] Test OTP verification
- [ ] Test admin functions

---

## Next Steps

1. **Fix Frontend Files** (see list above)
2. **Set up MongoDB Atlas** for backend
3. **Deploy Backend** to Render with Atlas connection string
4. **Deploy Frontend** with backend URL as environment variable
5. **Create First Pool** via frontend
6. **Deploy KWALA Workflows** with pool address

---

## Current Configuration

### Deployed Contracts
- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **PoolFactory:** `0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a`
- **RPC:** Alchemy Sepolia
- **Explorer:** https://sepolia.etherscan.io

### Frontend Status
- ✅ Next.js 16.0.1 configured
- ✅ Smart contract integration ready
- ✅ Sepolia network configured
- ⚠️ API calls need updating (32+ instances)
- ⚠️ Environment variables set up but not used yet

### Backend Status
- ✅ All KWALA endpoints implemented
- ✅ 6 API routes ready
- ⚠️ Needs MongoDB Atlas (currently localhost)
- ⚠️ Needs deployment to Render

---

## Cost Estimate

- **Vercel:** Free tier (Hobby) - suitable for testing
- **Netlify:** Free tier - suitable for testing
- **MongoDB Atlas:** Free tier (512MB) - sufficient for MVP
- **Render:** Free tier - backend hosting
- **Sepolia Testnet:** Free (test ETH from faucet)

**Total Cost:** $0/month for testing phase

---

## Support Resources

- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Test backend `/health` endpoint directly
4. Check network tab in browser DevTools
5. Verify wallet is connected to Sepolia network
