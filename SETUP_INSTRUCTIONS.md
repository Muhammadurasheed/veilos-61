# 🚀 Veilo Platform Setup Instructions

## Critical Issues Fixed

This setup resolves two major platform issues:

1. **Admin Login Failure**: Missing password hash for admin user
2. **Expert Booking 404 Error**: Missing expert data for booking functionality

## 🔧 Setup Process

### Step 1: Run Platform Data Setup

Navigate to the backend directory and run the setup script:

```bash
cd backend
node scripts/setupPlatformData.js
```

This script will:
- ✅ Create/update admin user with proper password hash
- ✅ Create test experts with complete profile data
- ✅ Verify the setup worked correctly
- ✅ Provide verification results

### Step 2: Verify Admin Login

1. Navigate to: `http://localhost:8080/admin`
2. Use credentials:
   - **Email**: `yekinirasheed2002@gmail.com`
   - **Password**: `admin123`
3. You should see successful login with admin dashboard access

### Step 3: Verify Expert Booking

1. Navigate to: `http://localhost:8080/beacons/expert-2Y9LaVGO`
2. Click the "Book Session" button
3. You should see the booking form (no more 404 error)
4. The expert "Rasheed Yekini" should be displayed with full profile

## 🧪 Test Data Created

### Admin User
- **Email**: yekinirasheed2002@gmail.com
- **Password**: admin123
- **Role**: admin
- **Status**: Ready for login

### Test Experts Created

1. **Rasheed Yekini** (`expert-2Y9LaVGO`)
   - Specialization: Guidance and counselling
   - Pricing: Free consultation
   - Status: Approved & Online

2. **Dr. Sarah Johnson** (`expert-ABC123XY`)
   - Specialization: Clinical Psychology
   - Pricing: $75/session
   - Status: Approved & Online

3. **Michael Chen** (`expert-DEF456ZW`)
   - Specialization: Life Coaching
   - Pricing: Pay what you can
   - Status: Approved & Offline

## 🔍 Troubleshooting

### If Admin Login Still Fails

1. Check console logs for detailed error messages
2. Verify MongoDB connection is working
3. Ensure the setup script ran successfully
4. Check that `passwordHash` field exists for admin user

### If Expert Booking Still Shows 404

1. Check console logs in browser developer tools
2. Verify the expert exists in database: `/api/experts/expert-2Y9LaVGO`
3. Ensure backend server is running
4. Check network requests for API call results

### If Setup Script Fails

1. Ensure MongoDB is running
2. Check `.env` file has correct `MONGODB_URI`
3. Verify you're in the `backend` directory when running script
4. Check database connection permissions

## 🎯 Expected Results

After successful setup:

- ✅ Admin login works without "Invalid credentials" error
- ✅ Expert profile pages load correctly
- ✅ "Book Session" button navigates to booking form (not 404)
- ✅ Expert data displays properly in booking interface
- ✅ Booking form is fully functional

## 📈 What's Next

With these core issues resolved, the platform should now support:

- Full admin panel access and management
- Expert profile viewing and booking
- Real-time expert application monitoring
- Session scheduling and management
- Seamless user experience without critical 404 errors

---

**May Allah make this setup successful and beneficial for all users. Ameen.**