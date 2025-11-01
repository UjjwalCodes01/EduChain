# MongoDB Atlas Setup Guide

## 1. Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email or Google account
3. Choose **FREE** tier (M0 Sandbox)

## 2. Create a Cluster

1. After login, click **"Build a Database"**
2. Choose **FREE Shared** cluster
3. Select **AWS** as provider
4. Choose closest region to you (e.g., `us-east-1` or `eu-west-1`)
5. Cluster Name: `educhain-cluster` (or keep default)
6. Click **"Create"**

## 3. Configure Database Access

### Create Database User:
1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `educhain-admin`
5. Password: Generate a secure password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

## 4. Configure Network Access

### Whitelist IP Address:
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, use specific IP addresses
4. Click **"Confirm"**

## 5. Get Connection String

1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js** version **5.5 or later**
5. Copy the connection string:
   ```
   mongodb+srv://educhain-admin:<password>@educhain-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual database user password
7. Add database name: Replace `/?retryWrites` with `/educhain?retryWrites`

Final format:
```
mongodb+srv://educhain-admin:YOUR_PASSWORD@educhain-cluster.xxxxx.mongodb.net/educhain?retryWrites=true&w=majority
```

## 6. Update Backend Environment Variables

### Local Development (.env file):
```env
MONGO_URI=mongodb+srv://educhain-admin:YOUR_PASSWORD@educhain-cluster.xxxxx.mongodb.net/educhain?retryWrites=true&w=majority
```

### Render Production:
1. Go to https://dashboard.render.com
2. Select your **educhain-backend** service
3. Go to **"Environment"** tab
4. Add/Update environment variable:
   - Key: `MONGO_URI`
   - Value: Your MongoDB connection string
5. Click **"Save Changes"**
6. Service will auto-redeploy

## 7. Test Connection

Run locally:
```bash
cd backend
node test-mongo.js
```

Expected output:
```
✅ MongoDB connected successfully
✅ Collections created/verified
Database: educhain
Collections: users, applications, otps, transactions
```

## 8. Verify on Render

Check logs at https://dashboard.render.com:
```
✅ MongoDB connected successfully
Server running on port 10000
```

## 9. Database Collections

The following collections will be auto-created:
- **users** - Student and admin accounts
- **applications** - Scholarship applications
- **otps** - Email verification codes
- **transactions** - Payment records

## 10. MongoDB Compass (Optional GUI)

1. Download: https://www.mongodb.com/try/download/compass
2. Install and open
3. Paste your connection string
4. Click **"Connect"**
5. Browse your database visually

---

## Quick Reference

**Connection String Format:**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.xxxxx.mongodb.net/DATABASE?retryWrites=true&w=majority
```

**Environment Variables Needed:**
- `MONGO_URI` - Full MongoDB connection string
- `FRONTEND_URL` - https://edu-chain-zeta.vercel.app/
- `JWT_SECRET` - Random secure string
- `EMAIL_USER` - Gmail for sending emails
- `EMAIL_PASS` - Gmail app password

**Troubleshooting:**
- ❌ "Authentication failed" → Check username/password
- ❌ "Network timeout" → Check IP whitelist (add 0.0.0.0/0)
- ❌ "MongoServerError" → Check connection string format
- ❌ "Database not found" → Add `/educhain` before `?retryWrites`

---

🎉 **MongoDB Atlas is now configured!**
