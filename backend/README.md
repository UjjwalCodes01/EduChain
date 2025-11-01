# EduChain Backend API

Backend API for EduChain - A decentralized scholarship management platform.

## Features

- 📧 Email verification for student applications
- 📁 IPFS integration for document storage
- 🔒 Rate limiting and security
- 📊 Admin dashboard APIs
- 🗄️ MongoDB for application data
- ✉️ Automated email notifications

## Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** with Mongoose
- **IPFS** for decentralized storage
- **Nodemailer** for email services
- **Multer** for file uploads
- **Rate limiting** for API protection

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/educhain

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# IPFS (Infura)
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_PROJECT_ID=your_infura_project_id
IPFS_PROJECT_SECRET=your_infura_project_secret

# JWT
JWT_SECRET=your_jwt_secret_key

# Frontend
FRONTEND_URL=https://edu-chain-zeta.vercel.app/
```

### 3. Run MongoDB

Make sure MongoDB is running locally or use a cloud instance (MongoDB Atlas).

### 4. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Public Endpoints

#### Application Submission
```http
POST /api/applications/submit
Content-Type: multipart/form-data

Body:
- walletAddress: string
- email: string
- poolId: string
- poolAddress: string
- applicationData: object
- document: file (optional, max 10MB)
```

#### Email Verification
```http
GET /api/applications/verify/:token
```

#### Resend Verification
```http
POST /api/applications/resend-verification
Content-Type: application/json

Body:
{
  "walletAddress": "0x...",
  "poolAddress": "0x..."
}
```

#### Get Application
```http
GET /api/applications/wallet/:walletAddress/pool/:poolAddress
```

#### Get Wallet Applications
```http
GET /api/applications/wallet/:walletAddress
```

#### Get Pool Applications
```http
GET /api/applications/pool/:poolAddress?status=verified
```

### Admin Endpoints

#### Get All Applications
```http
GET /api/admin/applications?status=verified&page=1&limit=50
```

#### Get Statistics
```http
GET /api/admin/statistics?poolAddress=0x...
```

#### Approve Application
```http
POST /api/admin/applications/:applicationId/approve
Content-Type: application/json

Body:
{
  "adminAddress": "0x...",
  "notes": "Approved based on criteria"
}
```

#### Reject Application
```http
POST /api/admin/applications/:applicationId/reject
Content-Type: application/json

Body:
{
  "adminAddress": "0x...",
  "notes": "Does not meet requirements"
}
```

#### Mark as Paid
```http
POST /api/admin/applications/:applicationId/paid
Content-Type: application/json

Body:
{
  "transactionHash": "0x..."
}
```

#### Batch Approve
```http
POST /api/admin/applications/batch-approve
Content-Type: application/json

Body:
{
  "applicationIds": ["id1", "id2", ...],
  "adminAddress": "0x...",
  "notes": "Batch approval"
}
```

## Project Structure

```
backend/
├── controllers/
│   ├── applicationController.js  # Application logic
│   └── adminController.js        # Admin operations
├── models/
│   └── Application.js            # MongoDB schema
├── routes/
│   ├── applicationRoutes.js      # Application routes
│   └── adminRoutes.js            # Admin routes
├── utils/
│   ├── ipfs.js                   # IPFS utilities
│   └── email.js                  # Email utilities
├── middleware/
│   └── rateLimiter.js            # Rate limiting
├── app.js                        # Main server file
├── .env.example                  # Environment template
└── package.json
```

## Rate Limits

- General API: 100 requests per 15 minutes
- Application submission: 5 per hour per IP
- Email requests: 3 per 15 minutes per IP
- Admin actions: 30 per minute per IP

## Email Setup (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account > Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password
3. Use the app password in `EMAIL_PASS`

## IPFS Setup (Infura)

1. Sign up at https://infura.io
2. Create a new IPFS project
3. Get your Project ID and Project Secret
4. Add them to your `.env` file

## Development

Install nodemon for auto-reload:
```bash
npm install -D nodemon
```

Run in development mode:
```bash
npm run dev
```

## Security Notes

- All wallet addresses are stored in lowercase
- Rate limiting is enabled on all endpoints
- File uploads are limited to 10MB
- Only JPEG, PNG, and PDF files are accepted
- Email verification required before approval

## License

MIT
