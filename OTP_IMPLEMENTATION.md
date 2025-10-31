# OTP Email Verification System

## Overview
This implementation adds OTP (One-Time Password) email verification to the registration flow. Users receive a 6-digit code via email that they must enter to verify their email address before completing registration.

## Backend Implementation

### Files Created/Modified:

#### 1. **`backend/models/OTP.js`** - OTP Model
Stores OTP records with auto-expiration:
- `email`: User's email address
- `walletAddress`: User's wallet address
- `otp`: 6-digit code
- `expiresAt`: TTL (Time To Live) - auto-deletes after expiration
- `verified`: Boolean flag
- `attempts`: Track verification attempts (max 3)

#### 2. **`backend/controllers/otpController.js`** - OTP Logic
- **`sendOTP`**: Generates & sends 6-digit OTP via email
  - Deletes existing OTPs for the email
  - Creates new OTP with 10-minute expiration
  - Sends email using nodemailer
  - Returns OTP in development mode

- **`verifyOTP`**: Validates the entered OTP
  - Checks if OTP exists and not expired
  - Verifies the code matches
  - Tracks failed attempts (max 3)
  - Marks OTP as verified on success

#### 3. **`backend/routes/otpRoutes.js`** - API Endpoints
```javascript
POST /api/otp/send      - Send OTP to email
POST /api/otp/verify    - Verify the OTP code
```

#### 4. **`backend/utils/email.js`** - Email Template
Added `sendOTPEmail()` function with professional HTML email template:
- Large, clear OTP display
- 10-minute expiration warning
- Security tips
- Branded EduChain design

## Frontend Implementation

### Files Created:

#### **`frontend/components/OTPModal.tsx`** - OTP Verification Modal
Features:
- **6-digit input boxes** with auto-focus
- **Paste support** - paste entire OTP at once
- **10-minute countdown timer**
- **Resend OTP** button (enabled after expiry)
- **Auto-validation** - checks OTP length before submitting
- **Error handling** with toast notifications
- **Development mode** - shows OTP in console

## Usage in Details Page

### Step-by-Step Integration:

1. **Add OTP Modal state:**
```typescript
const [showOTPModal, setShowOTPModal] = useState(false);
const [otpEmail, setOTPEmail] = useState("");
const [otpVerified, setOTPVerified] = useState(false);
```

2. **Before registration submission:**
```typescript
const submitStudent = async () => {
  // Validate form fields...
  
  if (!otpVerified) {
    // Show OTP modal first
    setOTPEmail(studentForm.email);
    setShowOTPModal(true);
    return;
  }
  
  // Proceed with registration...
};
```

3. **Handle OTP verification:**
```typescript
const handleOTPVerified = () => {
  setOTPVerified(true);
  setShowOTPModal(false);
  // Now submit the registration
  submitStudent();
};
```

4. **Render OTP Modal:**
```typescript
{showOTPModal && (
  <OTPModal
    email={otpEmail}
    walletAddress={walletAddress}
    onVerified={handleOTPVerified}
    onCancel={() => setShowOTPModal(false)}
  />
)}
```

## API Endpoints

### Send OTP
```http
POST /api/otp/send
Content-Type: application/json

{
  "email": "student@university.edu",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "email": "student@university.edu",
    "expiresIn": "10 minutes",
    "otp": "123456" // Only in development mode
  }
}
```

### Verify OTP
```http
POST /api/otp/verify
Content-Type: application/json

{
  "email": "student@university.edu",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true,
    "email": "student@university.edu",
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
  }
}
```

## Security Features

1. **Rate Limiting:**
   - 5 OTP requests per 15 minutes
   - 10 verification attempts per 15 minutes

2. **Expiration:**
   - OTP expires in 10 minutes
   - Auto-deletion from database after expiry

3. **Attempt Limiting:**
   - Maximum 3 verification attempts per OTP
   - Must request new OTP after 3 failed attempts

4. **Email Validation:**
   - Prevents registration with already-used emails
   - Case-insensitive email matching

## Email Configuration

Set environment variables in `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

For Gmail:
1. Enable 2-Factor Authentication
2. Generate App-Specific Password
3. Use that password in `EMAIL_PASS`

## Development vs Production

### Development Mode:
- OTP shown in API response
- OTP shown in toast notification
- 10-minute expiration
- Console logging enabled

### Production Mode:
- OTP only sent via email
- No OTP in responses
- Same 10-minute expiration
- Minimal logging

## User Flow

1. User fills registration form (Student/Provider)
2. User clicks "Register" button
3. **OTP Modal appears**
4. OTP sent to user's email
5. User enters 6-digit code
6. System verifies OTP
7. On success, registration proceeds
8. User redirected to Home page

## Database Schema

### OTP Collection:
```javascript
{
  _id: ObjectId,
  email: String (lowercase, indexed),
  walletAddress: String (lowercase, indexed),
  otp: String (6 digits),
  expiresAt: Date (TTL index),
  verified: Boolean,
  attempts: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

- **Invalid OTP**: Shows remaining attempts
- **Expired OTP**: Prompts to resend
- **Email sending fails**: Returns error to user
- **Network errors**: Toast notifications
- **Max attempts exceeded**: Must request new OTP

## Future Enhancements

- [ ] SMS OTP option
- [ ] Remember device/browser
- [ ] OTP via WhatsApp
- [ ] Biometric verification
- [ ] Multi-factor authentication
- [ ] OTP analytics dashboard

## Testing

### Manual Testing:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Go to `/details` page
4. Select role and fill form
5. Click Register
6. Check email for OTP
7. Enter OTP in modal
8. Verify successful registration

### Development Testing:
- OTP is shown in API response
- OTP is shown in toast notification
- Check browser console for OTP

## Troubleshooting

**OTP not received:**
- Check spam/junk folder
- Verify email credentials in `.env`
- Check backend console for errors
- Try resending OTP

**OTP verification fails:**
- Ensure OTP hasn't expired (10 min)
- Check for typos in entered code
- Verify network connection
- Check backend logs

**Email service not working:**
- Verify `EMAIL_USER` and `EMAIL_PASS`
- For Gmail, use App-Specific Password
- Check firewall/network settings
- Try different email service

## Support

For issues or questions:
- Check backend logs
- Check frontend console
- Verify environment variables
- Test email service separately
