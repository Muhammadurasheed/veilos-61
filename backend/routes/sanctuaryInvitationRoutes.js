const express = require('express');
const router = express.Router();
const SanctuaryInvitation = require('../models/SanctuaryInvitation');
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const { authMiddleware } = require('../middleware/auth');

// Create invitation for a sanctuary session
router.post('/sessions/:sessionId/invitations', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { maxUses, expirationHours = 24, requiresApproval = false } = req.body;

    // Verify session exists and user is host
    const session = await LiveSanctuarySession.findOne({ id: sessionId });
    if (!session) {
      return res.error('Sanctuary session not found', 404);
    }

    if (session.hostId !== req.user.id) {
      return res.error('Only the host can create invitations', 403);
    }

    // Create invitation
    const invitation = new SanctuaryInvitation({
      sessionId,
      createdBy: req.user.shadowId,
      maxUses,
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
      metadata: {
        sessionTopic: session.topic,
        hostAlias: session.hostAlias
      },
      restrictions: {
        requiresApproval,
        allowAnonymous: true,
        maxParticipantsViaInvite: maxUses
      }
    });

    await invitation.save();

    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sanctuary/join/${invitation.inviteCode}`;

    return res.success({
      invitation: {
        id: invitation.id,
        inviteCode: invitation.inviteCode,
        invitationUrl,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
        usedCount: invitation.usedCount,
        sessionTopic: session.topic
      }
    }, 'Invitation created successfully');

  } catch (error) {
    console.error('Create invitation error:', error);
    return res.error('Failed to create invitation', 500);
  }
});

// Join sanctuary via invitation code
router.post('/join/:inviteCode', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    // Find and validate invitation
    const invitation = await SanctuaryInvitation.findOne({
      inviteCode: inviteCode.toLowerCase(),
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.error('Invalid or expired invitation', 404);
    }

    // Check usage limits
    if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
      return res.error('Invitation has reached maximum usage limit', 400);
    }

    // Get session details
    const session = await LiveSanctuarySession.findOne({ id: invitation.sessionId });
    if (!session || !session.isActive) {
      return res.error('Sanctuary session is no longer active', 400);
    }

    // Check if session has space
    if (session.currentParticipants >= session.maxParticipants) {
      return res.error('Sanctuary session is full', 400);
    }

    // Log invitation usage
    invitation.usageLog.push({
      shadowId: req.user.shadowId,
      alias: req.user.alias,
      joinedAt: new Date(),
      ipAddress: req.ip
    });
    invitation.usedCount += 1;
    await invitation.save();

    // Return session details for joining
    return res.success({
      session: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        hostAlias: session.hostAlias,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken, // Will be participant token
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        allowAnonymous: session.allowAnonymous,
        audioOnly: session.audioOnly,
        moderationEnabled: session.moderationEnabled,
        emergencyContactEnabled: session.emergencyContactEnabled,
        expiresAt: session.expiresAt
      },
      role: 'participant',
      redirectUrl: `/live-sanctuary/${session.id}?role=participant`
    }, `Successfully joined "${session.topic}"`);

  } catch (error) {
    console.error('Join via invitation error:', error);
    return res.error('Failed to join sanctuary', 500);
  }
});

// Get invitation details (for preview)
router.get('/preview/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const invitation = await SanctuaryInvitation.findOne({
      inviteCode: inviteCode.toLowerCase(),
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.error('Invalid or expired invitation', 404);
    }

    const session = await LiveSanctuarySession.findOne({ id: invitation.sessionId });
    if (!session) {
      return res.error('Sanctuary session not found', 404);
    }

    return res.success({
      preview: {
        sessionTopic: session.topic,
        sessionDescription: session.description,
        emoji: session.emoji,
        hostAlias: session.hostAlias,
        currentParticipants: session.currentParticipants,
        maxParticipants: session.maxParticipants,
        expiresAt: invitation.expiresAt,
        isActive: session.isActive,
        hasSpace: session.currentParticipants < session.maxParticipants
      }
    }, 'Invitation preview loaded');

  } catch (error) {
    console.error('Get invitation preview error:', error);
    return res.error('Failed to load invitation preview', 500);
  }
});

// Get invitations for a session (host only)
router.get('/sessions/:sessionId/invitations', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists and user is host
    const session = await LiveSanctuarySession.findOne({ id: sessionId });
    if (!session) {
      return res.error('Sanctuary session not found', 404);
    }

    if (session.hostId !== req.user.id) {
      return res.error('Only the host can view invitations', 403);
    }

    const invitations = await SanctuaryInvitation.find({
      sessionId,
      isActive: true
    }).sort({ 'metadata.createdAt': -1 });

    return res.success({
      invitations: invitations.map(inv => ({
        id: inv.id,
        inviteCode: inv.inviteCode,
        invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sanctuary/join/${inv.inviteCode}`,
        maxUses: inv.maxUses,
        usedCount: inv.usedCount,
        expiresAt: inv.expiresAt,
        createdAt: inv.metadata.createdAt,
        restrictions: inv.restrictions
      }))
    }, 'Invitations retrieved successfully');

  } catch (error) {
    console.error('Get session invitations error:', error);
    return res.error('Failed to retrieve invitations', 500);
  }
});

// Deactivate invitation
router.delete('/invitations/:inviteCode', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const invitation = await SanctuaryInvitation.findOne({
      inviteCode: inviteCode.toLowerCase(),
      isActive: true
    });

    if (!invitation) {
      return res.error('Invitation not found', 404);
    }

    if (invitation.createdBy !== req.user.shadowId) {
      return res.error('Only the creator can deactivate this invitation', 403);
    }

    invitation.isActive = false;
    await invitation.save();

    return res.success(null, 'Invitation deactivated successfully');

  } catch (error) {
    console.error('Deactivate invitation error:', error);
    return res.error('Failed to deactivate invitation', 500);
  }
});

module.exports = router;