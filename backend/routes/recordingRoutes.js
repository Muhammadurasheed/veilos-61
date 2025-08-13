const express = require('express');
const router = express.Router();
const SessionRecording = require('../models/SessionRecording');
const AIModerationLog = require('../models/AIModerationLog');
const { authenticateToken } = require('../middleware/auth');
const { nanoid } = require('nanoid');
const crypto = require('crypto');

// Start session recording
router.post('/:sessionId/recording/start', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionType, recordingType = 'audio_only', retentionPolicy = 'delete_after_session' } = req.body;

    // Check if recording already exists
    const existingRecording = await SessionRecording.findOne({
      sessionId,
      processingStatus: { $in: ['recording', 'processing'] }
    });

    if (existingRecording) {
      return res.status(400).json({ success: false, error: 'Recording already in progress' });
    }

    // Generate encryption key
    const encryptionKey = crypto.randomBytes(32).toString('hex');

    const recording = new SessionRecording({
      sessionId,
      sessionType,
      recordingType,
      initiatedBy: req.userId,
      startTime: new Date(),
      retentionPolicy,
      encryptionKey,
      processingStatus: 'recording'
    });

    await recording.save();

    res.json({
      success: true,
      data: {
        recordingId: recording.id,
        startTime: recording.startTime,
        retentionPolicy: recording.retentionPolicy
      }
    });
  } catch (error) {
    console.error('Start recording error:', error);
    res.status(500).json({ success: false, error: 'Failed to start recording' });
  }
});

// Stop session recording
router.post('/:sessionId/recording/stop', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const recording = await SessionRecording.findOne({
      sessionId,
      processingStatus: 'recording'
    });

    if (!recording) {
      return res.status(404).json({ success: false, error: 'No active recording found' });
    }

    // Check permission
    if (recording.initiatedBy !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only recording initiator can stop recording' });
    }

    recording.endTime = new Date();
    recording.duration = Math.floor((recording.endTime - recording.startTime) / 1000);
    recording.processingStatus = 'processing';

    await recording.save();

    // In production, trigger background processing job here
    // processRecording(recording.id);

    res.json({
      success: true,
      data: {
        recordingId: recording.id,
        duration: recording.duration,
        endTime: recording.endTime
      }
    });
  } catch (error) {
    console.error('Stop recording error:', error);
    res.status(500).json({ success: false, error: 'Failed to stop recording' });
  }
});

// Get recording consent from participant
router.post('/:sessionId/recording/consent', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { consentGiven, alias } = req.body;

    const recording = await SessionRecording.findOne({
      sessionId,
      processingStatus: { $in: ['recording', 'processing'] }
    });

    if (!recording) {
      return res.status(404).json({ success: false, error: 'No recording found' });
    }

    // Update or add consent
    const existingConsent = recording.participantConsent.find(c => c.userId === req.userId);
    if (existingConsent) {
      existingConsent.consentGiven = consentGiven;
      existingConsent.consentAt = new Date();
    } else {
      recording.participantConsent.push({
        userId: req.userId,
        alias: alias || `User ${req.userId}`,
        consentGiven,
        consentAt: new Date()
      });
    }

    await recording.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Recording consent error:', error);
    res.status(500).json({ success: false, error: 'Failed to update consent' });
  }
});

// AI Moderation: Log detection
router.post('/:sessionId/moderation/log', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      sessionType,
      participantId,
      participantAlias,
      moderationType,
      detectionMethod,
      flaggedContent,
      confidence,
      riskLevel,
      categories,
      aiModelVersion
    } = req.body;

    const moderationLog = new AIModerationLog({
      sessionId,
      sessionType,
      participantId,
      participantAlias,
      moderationType,
      detectionMethod,
      flaggedContent,
      detectionTimestamp: new Date(),
      confidence,
      riskLevel,
      categories,
      aiModelVersion
    });

    // Auto-escalate critical risks
    if (riskLevel === 'critical') {
      moderationLog.escalated = true;
      moderationLog.escalatedTo = 'crisis_counselor';
      moderationLog.escalationTimestamp = new Date();
    }

    await moderationLog.save();

    res.json({
      success: true,
      data: {
        moderationId: moderationLog.id,
        escalated: moderationLog.escalated,
        recommendedAction: getRecommendedAction(riskLevel, categories)
      }
    });
  } catch (error) {
    console.error('AI moderation log error:', error);
    res.status(500).json({ success: false, error: 'Failed to log moderation event' });
  }
});

// Take moderation action
router.post('/:sessionId/moderation/action', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { moderationId, actionTaken, actionTakenBy = 'human_moderator' } = req.body;

    const moderationLog = await AIModerationLog.findOne({ id: moderationId });
    if (!moderationLog) {
      return res.status(404).json({ success: false, error: 'Moderation log not found' });
    }

    moderationLog.actionTaken = actionTaken;
    moderationLog.actionTakenBy = actionTakenBy;
    moderationLog.resolved = ['warning', 'mute', 'temporary_removal', 'permanent_ban'].includes(actionTaken);

    if (moderationLog.resolved) {
      moderationLog.resolvedBy = req.userId;
      moderationLog.resolvedAt = new Date();
    }

    await moderationLog.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Moderation action error:', error);
    res.status(500).json({ success: false, error: 'Failed to take moderation action' });
  }
});

// Get moderation analytics
router.get('/:sessionId/moderation/analytics', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const analytics = await AIModerationLog.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: null,
          totalFlags: { $sum: 1 },
          criticalRisks: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } },
          escalatedCases: { $sum: { $cond: ['$escalated', 1, 0] } },
          resolvedCases: { $sum: { $cond: ['$resolved', 1, 0] } },
          averageConfidence: { $avg: '$confidence' },
          commonCategories: { $push: '$categories' }
        }
      }
    ]);

    res.json({
      success: true,
      data: analytics[0] || {
        totalFlags: 0,
        criticalRisks: 0,
        escalatedCases: 0,
        resolvedCases: 0,
        averageConfidence: 0,
        commonCategories: []
      }
    });
  } catch (error) {
    console.error('Moderation analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get moderation analytics' });
  }
});

// Helper function to recommend actions based on risk
function getRecommendedAction(riskLevel, categories) {
  if (riskLevel === 'critical') {
    if (categories.includes('self_harm') || categories.includes('crisis_language')) {
      return 'immediate_escalation';
    }
    return 'temporary_removal';
  }
  
  if (riskLevel === 'high') {
    return 'warning';
  }
  
  if (riskLevel === 'medium') {
    return 'monitoring';
  }
  
  return 'none';
}

module.exports = router;