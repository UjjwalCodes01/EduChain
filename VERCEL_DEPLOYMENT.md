# Vercel Frontend Deployment Guide

## Prerequisites
- GitHub account with EduChain repository
- Vercel account (sign up at https://vercel.com)
- Backend deployed on Render

---

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your **EduChain** repository
4. Click **"Import"**

### Step 2: Configure Project

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

### Step 3: Environment Variables

Click **"Add Environment Variables"** and add the following:

```env
NEXT_PUBLIC_API_URL=https://educhain-3.onrender.com
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a
NEXT_PUBLIC_SCHOLARSHIP_POOL_ADDRESS=0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy from Frontend Directory

```bash
cd frontend
vercel --prod
```

### Step 4: Follow Prompts

1. Set up and deploy: **Yes**
2. Which scope: Select your account
3. Link to existing project: **No**
4. Project name: `educhain` (or your choice)
5. Directory: `.` (current directory)
6. Override settings: **No**

### Step 5: Add Environment Variables

After first deployment:

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://educhain-3.onrender.com

vercel env add NEXT_PUBLIC_POOL_FACTORY_ADDRESS
# Enter: 0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a

vercel env add NEXT_PUBLIC_SCHOLARSHIP_POOL_ADDRESS
# Enter: 0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE

vercel env add NEXT_PUBLIC_CHAIN_ID
# Enter: 11155111

vercel env add NEXT_PUBLIC_RPC_URL
# Enter: https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh
```

### Step 6: Redeploy with Environment Variables

```bash
vercel --prod
```

---

## Post-Deployment Configuration

### 1. Update Backend CORS

On Render dashboard, add environment variable:

```env
FRONTEND_URL=https://your-app.vercel.app
```

**Replace** `your-app` with your actual Vercel domain.

### 2. Custom Domain (Optional)

1. Go to Vercel project settings
2. Click **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed
5. Update `FRONTEND_URL` on Render to match

### 3. Test Deployment

Visit your Vercel URL and test:
- ✅ MetaMask connection
- ✅ Pool loading from blockchain
- ✅ Application submission
- ✅ Admin dashboard access
- ✅ Payment transactions

---

## Automatic Deployments

Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On pull requests

### Disable Auto-Deployment (Optional)

In Vercel project settings:
1. Go to **Git**
2. Configure **Production Branch**
3. Toggle **Auto-deploy** off if needed

---

## Environment Variables Management

### View All Environment Variables

```bash
vercel env ls
```

### Pull Environment Variables Locally

```bash
vercel env pull
```

### Remove Environment Variable

```bash
vercel env rm VARIABLE_NAME
```

---

## Troubleshooting

### Build Fails

**Error**: "Module not found"
- **Solution**: Check `package.json` dependencies in `/frontend`
- Run `npm install` locally to verify

**Error**: "Type error in TypeScript"
- **Solution**: Fix TypeScript errors locally first
- Run `npm run build` in `/frontend` to test

### Runtime Errors

**Error**: "API calls failing"
- **Solution**: Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running on Render
- Check CORS settings on backend

**Error**: "MetaMask not connecting"
- **Solution**: Verify contract addresses are correct
- Check `NEXT_PUBLIC_CHAIN_ID` is `11155111`
- Ensure RPC URL is valid

### Environment Variables Not Loading

**Problem**: `process.env.NEXT_PUBLIC_*` is undefined
- **Solution**: Redeploy after adding env vars
- Ensure variables start with `NEXT_PUBLIC_`
- Check variables in Vercel dashboard settings

---

## Logs and Monitoring

### View Deployment Logs

1. Go to Vercel dashboard
2. Select your project
3. Click **"Deployments"**
4. Click on deployment to view logs

### View Runtime Logs

```bash
vercel logs <deployment-url>
```

### Real-time Logs

```bash
vercel logs --follow
```

---

## Performance Optimization

### Enable Caching

Vercel automatically caches:
- Static assets (images, CSS, JS)
- API routes (configure in `next.config.ts`)
- Page renders (ISR/SSG)

### Add Image Optimization

Update `next.config.ts`:

```typescript
const config: NextConfig = {
  images: {
    domains: ['your-image-domain.com'],
  },
};
```

---

## Rollback Deployment

### Via Dashboard

1. Go to **"Deployments"**
2. Find previous working deployment
3. Click **"..."** menu
4. Click **"Promote to Production"**

### Via CLI

```bash
vercel rollback
```

---

## Production Checklist

Before going live:

- [ ] MongoDB Atlas configured and connected
- [ ] Backend deployed on Render with all env vars
- [ ] Frontend deployed on Vercel with all env vars
- [ ] CORS updated with Vercel URL
- [ ] MetaMask connection tested
- [ ] Contract interactions tested (read/write)
- [ ] Admin dashboard tested
- [ ] Payment flow tested on Sepolia
- [ ] Error handling verified
- [ ] Mobile responsiveness checked

---

## Quick Commands Reference

```bash
# Deploy to production
cd frontend && vercel --prod

# Deploy to preview
cd frontend && vercel

# View logs
vercel logs

# View environment variables
vercel env ls

# Open project in browser
vercel open

# View project info
vercel inspect
```

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Community**: https://github.com/vercel/vercel/discussions

---

🎉 **Your EduChain frontend is now live on Vercel!**

Production URL: `https://your-project.vercel.app`
