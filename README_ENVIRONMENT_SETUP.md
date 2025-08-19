# Veilo Environment Setup Guide

## Quick Start

1. **Copy environment file**:
   ```bash
   cp .env.example backend/.env
   ```

2. **Set required variables** in `backend/.env`:
   ```bash
   # Minimum required for basic functionality
   MONGODB_URI=mongodb://localhost:27017/veilo
   JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
   ```

3. **Create admin user**:
   ```bash
   cd backend
   node scripts/createAdminUser.js
   ```

4. **Start the server**:
   ```bash
   cd backend
   npm start
   ```

## Critical Environment Variables

### 🔴 Required for Basic Functionality

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (minimum 32 characters)

### 🟡 Required for Live Audio Features

- `AGORA_APP_ID` - Your Agora.io App ID
- `AGORA_APP_CERTIFICATE` - Your Agora.io App Certificate

**To get Agora credentials:**
1. Sign up at [console.agora.io](https://console.agora.io)
2. Create a new project
3. Copy the App ID and App Certificate

### 🟢 Optional but Recommended

- `ADMIN_EMAIL` - Initial admin user email (default: admin@veilo.com)
- `ADMIN_PASSWORD` - Initial admin password (default: Admin123!@#)
- `CLOUDINARY_*` - File upload service
- `REDIS_URL` - Caching service

## Environment Setup by Feature

### Anonymous Sanctuary (Instant Support)
**Required**: None beyond basic setup
**Optional**: None
**Status**: ✅ Works out of the box

### Live Audio Sanctuary
**Required**: 
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`
**Status**: ❌ Currently broken without Agora setup

### Admin Panel
**Required**: Admin user created via script
**Setup**:
```bash
cd backend
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=YourPassword123 node scripts/createAdminUser.js
```
**Access**: Navigate to `/admin` and login

### Expert Registration & Verification
**Required**: Admin user for approval
**Optional**: `CLOUDINARY_*` for document uploads

## Troubleshooting

### 🚨 "Agora service not configured" error
**Solution**: Add Agora credentials to `.env`:
```bash
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_certificate_here
```

### 🚨 "Admin user already exists" 
**Solution**: Admin user already created. Access `/admin` with existing credentials.

### 🚨 "Socket connection failed"
**Symptoms**: Real-time features not working
**Solution**: Ensure frontend can reach backend WebSocket endpoint

### 🚨 Host can't access sanctuary after page refresh
**Status**: ✅ Fixed in Phase 1
**Solution**: Use new host recovery system at `/sanctuary/recover`

## Production Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veilo
JWT_SECRET=your_super_secure_production_secret
FRONTEND_URL=https://your-domain.com
AGORA_APP_ID=your_production_agora_app_id
AGORA_APP_CERTIFICATE=your_production_agora_certificate
```

### Security Checklist
- [ ] Change default admin password
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Enable file logging: `ENABLE_FILE_LOGGING=true`

## Feature Status Matrix

| Feature | Environment Required | Status | Notes |
|---------|---------------------|--------|-------|
| Anonymous Inbox | Basic setup | ✅ Working | Real-time fixed |
| Live Audio Rooms | + Agora credentials | ❌ Needs setup | 404 error without Agora |
| Admin Panel | + Admin user | ✅ Working | Access via `/admin` |
| Expert Verification | + Admin user | ✅ Working | Manual approval process |
| File Uploads | + Cloudinary | ⚠️ Optional | Fallback to local storage |
| Host Recovery | Basic setup | ✅ Working | New in Phase 1 |

## Getting Help

1. **Check logs**: Server logs show detailed error messages
2. **Verify environment**: Ensure all required variables are set
3. **Test connectivity**: Verify database and external service connections
4. **Admin access**: Create admin user if needed for panel access