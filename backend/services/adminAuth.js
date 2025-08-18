// Enhanced Admin Authentication with 2FA
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const auditLogger = require('./auditLogger');

class AdminAuthService {
  constructor() {
    this.tempTokens = new Map(); // For 2FA verification
    this.loginAttempts = new Map(); // Track login attempts
    this.sessionStore = new Map(); // Active admin sessions
  }

  // Generate secure admin password hash
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  // Verify password
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate 2FA secret for new admin
  generate2FASecret(adminEmail) {
    const secret = speakeasy.generateSecret({
      name: `Veilo Admin (${adminEmail})`,
      issuer: 'Veilo Platform',
      length: 32
    });
    
    return {
      secret: secret.base32,
      qrCodeURL: secret.otpauth_url,
      backupCodes: this.generateBackupCodes()
    };
  }

  // Generate backup codes for 2FA
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Generate QR code for 2FA setup
  async generateQRCode(secret) {
    try {
      return await QRCode.toDataURL(secret);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  // Verify 2FA token
  verify2FAToken(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) of variance
    });
  }

  // Check if IP has too many failed attempts
  checkRateLimit(ipAddress) {
    const attempts = this.loginAttempts.get(ipAddress) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    const windowStart = now - (15 * 60 * 1000); // 15 minutes window
    
    // Reset counter if outside window
    if (attempts.lastAttempt < windowStart) {
      attempts.count = 0;
    }
    
    if (attempts.count >= 5) {
      return {
        allowed: false,
        remaining: Math.ceil((attempts.lastAttempt + 15 * 60 * 1000 - now) / 1000 / 60)
      };
    }
    
    return { allowed: true, remaining: 0 };
  }

  // Record failed login attempt
  recordFailedAttempt(ipAddress) {
    const attempts = this.loginAttempts.get(ipAddress) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(ipAddress, attempts);
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(ipAddress) {
    this.loginAttempts.delete(ipAddress);
  }

  // Step 1: Initial login validation
  async initiateLogin(email, password, ipAddress, userAgent) {
    const rateLimit = this.checkRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      await auditLogger.logSecurityEvent(
        'rate_limit_exceeded',
        'high',
        `Admin login rate limit exceeded for IP ${ipAddress}`,
        { remainingMinutes: rateLimit.remaining },
        ipAddress
      );
      
      throw new Error(`Too many failed attempts. Try again in ${rateLimit.remaining} minutes.`);
    }

    // Find admin user (in real app, this would be from database)
    const User = require('../models/User');
    const admin = await User.findOne({ 
      email: email.toLowerCase(), 
      role: 'admin' 
    });

    if (!admin) {
      this.recordFailedAttempt(ipAddress);
      await auditLogger.logAuthEvent(
        null,
        'admin_login_failed',
        false,
        { reason: 'user_not_found', email, userAgent },
        ipAddress
      );
      throw new Error('Invalid credentials');
    }

    // Verify password (in production, admin passwords should be hashed)
    const passwordValid = admin.password ? 
      await this.verifyPassword(password, admin.password) :
      password === 'admin123'; // Temporary fallback

    if (!passwordValid) {
      this.recordFailedAttempt(ipAddress);
      await auditLogger.logAuthEvent(
        admin.id,
        'admin_login_failed',
        false,
        { reason: 'invalid_password', userAgent },
        ipAddress
      );
      throw new Error('Invalid credentials');
    }

    // Generate temporary token for 2FA step
    const tempToken = crypto.randomBytes(32).toString('hex');
    const tempData = {
      adminId: admin.id,
      email: admin.email,
      ipAddress,
      userAgent,
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };

    this.tempTokens.set(tempToken, tempData);

    await auditLogger.logAuthEvent(
      admin.id,
      'admin_login_step1',
      true,
      { step: '2fa_required', userAgent },
      ipAddress
    );

    return {
      step: 'verify_2fa',
      tempToken,
      requiresSetup: !admin.twoFactorSecret
    };
  }

  // Step 2: 2FA verification
  async verify2FA(tempToken, token, backupCode = null) {
    const tempData = this.tempTokens.get(tempToken);
    if (!tempData || Date.now() > tempData.expiresAt) {
      throw new Error('Invalid or expired verification token');
    }

    const User = require('../models/User');
    const admin = await User.findOne({ id: tempData.adminId });
    if (!admin) {
      throw new Error('Admin user not found');
    }

    let verified = false;
    let usedBackupCode = false;

    if (backupCode) {
      // Check backup code
      if (admin.twoFactorBackupCodes && admin.twoFactorBackupCodes.includes(backupCode)) {
        verified = true;
        usedBackupCode = true;
        
        // Remove used backup code
        admin.twoFactorBackupCodes = admin.twoFactorBackupCodes.filter(code => code !== backupCode);
        await admin.save();
      }
    } else if (token && admin.twoFactorSecret) {
      // Verify TOTP token
      verified = this.verify2FAToken(admin.twoFactorSecret, token);
    }

    if (!verified) {
      this.recordFailedAttempt(tempData.ipAddress);
      await auditLogger.logAuthEvent(
        admin.id,
        'admin_2fa_failed',
        false,
        { method: backupCode ? 'backup_code' : 'totp', userAgent: tempData.userAgent },
        tempData.ipAddress
      );
      throw new Error('Invalid verification code');
    }

    // Generate session token
    const sessionToken = jwt.sign(
      { 
        user: { id: admin.id },
        role: 'admin',
        sessionId: crypto.randomBytes(16).toString('hex'),
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Store session
    const sessionData = {
      adminId: admin.id,
      email: admin.email,
      ipAddress: tempData.ipAddress,
      userAgent: tempData.userAgent,
      loginTime: new Date(),
      lastActivity: new Date(),
      usedBackupCode
    };

    this.sessionStore.set(sessionToken, sessionData);

    // Cleanup
    this.tempTokens.delete(tempToken);
    this.clearFailedAttempts(tempData.ipAddress);

    await auditLogger.logAuthEvent(
      admin.id,
      'admin_login_success',
      true,
      { 
        method: usedBackupCode ? 'backup_code' : 'totp',
        sessionDuration: '8h',
        userAgent: tempData.userAgent
      },
      tempData.ipAddress
    );

    return {
      token: sessionToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      session: sessionData
    };
  }

  // Setup 2FA for admin
  async setup2FA(adminId) {
    const User = require('../models/User');
    const admin = await User.findOne({ id: adminId });
    
    if (!admin || admin.role !== 'admin') {
      throw new Error('Admin not found');
    }

    const twoFAData = this.generate2FASecret(admin.email);
    const qrCode = await this.generateQRCode(twoFAData.qrCodeURL);

    // Save secret temporarily (will be confirmed after verification)
    admin.twoFactorSecretTemp = twoFAData.secret;
    admin.twoFactorBackupCodesTemp = twoFAData.backupCodes;
    await admin.save();

    return {
      qrCode,
      secret: twoFAData.secret,
      backupCodes: twoFAData.backupCodes
    };
  }

  // Confirm 2FA setup
  async confirm2FASetup(adminId, token) {
    const User = require('../models/User');
    const admin = await User.findOne({ id: adminId });
    
    if (!admin || !admin.twoFactorSecretTemp) {
      throw new Error('2FA setup not initiated');
    }

    const verified = this.verify2FAToken(admin.twoFactorSecretTemp, token);
    if (!verified) {
      throw new Error('Invalid verification code');
    }

    // Confirm setup
    admin.twoFactorSecret = admin.twoFactorSecretTemp;
    admin.twoFactorBackupCodes = admin.twoFactorBackupCodesTemp;
    admin.twoFactorEnabled = true;
    admin.twoFactorSecretTemp = undefined;
    admin.twoFactorBackupCodesTemp = undefined;
    await admin.save();

    await auditLogger.logAdminAction(
      adminId,
      'enable_2fa',
      'admin_security',
      { setup_confirmed: true }
    );

    return { success: true };
  }

  // Validate session
  validateSession(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sessionData = this.sessionStore.get(token);
      
      if (!sessionData) {
        return { valid: false, reason: 'session_not_found' };
      }

      // Update last activity
      sessionData.lastActivity = new Date();
      this.sessionStore.set(token, sessionData);

      return {
        valid: true,
        admin: {
          id: decoded.user.id,
          role: decoded.role,
          sessionId: decoded.sessionId
        },
        session: sessionData
      };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  // Logout
  async logout(token, adminId, ipAddress) {
    this.sessionStore.delete(token);
    
    await auditLogger.logAuthEvent(
      adminId,
      'admin_logout',
      true,
      { method: 'manual' },
      ipAddress
    );

    return { success: true };
  }

  // Get active sessions
  getActiveSessions(adminId = null) {
    const sessions = [];
    
    for (const [token, data] of this.sessionStore) {
      if (!adminId || data.adminId === adminId) {
        sessions.push({
          sessionId: jwt.decode(token)?.sessionId,
          adminId: data.adminId,
          email: data.email,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          loginTime: data.loginTime,
          lastActivity: data.lastActivity
        });
      }
    }
    
    return sessions;
  }

  // Revoke session
  async revokeSession(sessionId, adminId, ipAddress) {
    for (const [token, data] of this.sessionStore) {
      const decoded = jwt.decode(token);
      if (decoded?.sessionId === sessionId) {
        this.sessionStore.delete(token);
        
        await auditLogger.logAdminAction(
          adminId,
          'revoke_session',
          'admin_security',
          { revokedSessionId: sessionId },
          ipAddress
        );
        
        return { success: true };
      }
    }
    
    throw new Error('Session not found');
  }

  // Cleanup expired sessions and temp tokens
  cleanup() {
    const now = Date.now();
    
    // Cleanup expired temp tokens
    for (const [token, data] of this.tempTokens) {
      if (now > data.expiresAt) {
        this.tempTokens.delete(token);
      }
    }
    
    // Cleanup expired sessions (8 hours + 1 hour grace period)
    for (const [token, data] of this.sessionStore) {
      const sessionAge = now - data.loginTime.getTime();
      if (sessionAge > 9 * 60 * 60 * 1000) { // 9 hours
        this.sessionStore.delete(token);
      }
    }
    
    // Cleanup old login attempts (older than 1 hour)
    for (const [ip, data] of this.loginAttempts) {
      if (now - data.lastAttempt > 60 * 60 * 1000) {
        this.loginAttempts.delete(ip);
      }
    }
  }
}

// Create singleton instance
const adminAuth = new AdminAuthService();

// Start cleanup interval
setInterval(() => {
  adminAuth.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = adminAuth;