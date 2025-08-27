const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

/**
 * Generate Agora RTC Token for audio/video calls
 * @param {string} channelName - The channel name
 * @param {number|string} uid - User ID (0 for auto-assign)
 * @param {string} role - 'publisher' or 'subscriber'
 * @param {number} expireTimeInSeconds - Token expiration time (default: 3600)
 * @returns {string} Generated RTC token
 */
exports.generateRtcToken = (channelName, uid = 0, role = 'publisher', expireTimeInSeconds = 3600) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error('Agora credentials not configured');
  }

  // Convert string uid to number if needed
  const numericUid = typeof uid === 'string' ? parseInt(uid) || 0 : uid;
  
  // Set role
  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  
  // Calculate expiration time
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

  // Generate token
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    numericUid,
    rtcRole,
    privilegeExpiredTs
  );

  return token;
};

/**
 * Generate channel name for sanctuary session
 * @param {string} sessionId - Sanctuary session ID
 * @returns {string} Formatted channel name
 */
exports.generateChannelName = (sessionId) => {
  return `sanctuary_${sessionId}`;
};

/**
 * Validate Agora configuration
 * @returns {boolean} Whether Agora is properly configured
 */
exports.validateAgoraConfig = () => {
  return !!(process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE);
};

// Add alias export for backward compatibility
exports.generateAgoraToken = exports.generateRtcToken;