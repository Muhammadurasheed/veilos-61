
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `comment-${nanoid(8)}`
  },
  userId: {
    type: String,
    required: true
  },
  userAlias: {
    type: String,
    required: true
  },
  userAvatarIndex: {
    type: Number,
    required: true
  },
  isExpert: {
    type: Boolean,
    default: false
  },
  expertId: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  languageCode: {
    type: String,
    default: 'en'
  }
});

const postSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `post-${nanoid(8)}`,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userAlias: {
    type: String,
    required: true
  },
  userAvatarIndex: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  feeling: {
    type: String
  },
  topic: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: String
  }],
  comments: [commentSchema],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    filename: String,
    size: Number
  }],
  wantsExpertHelp: {
    type: Boolean,
    default: false
  },
  languageCode: {
    type: String,
    default: 'en'
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  }
});

module.exports = mongoose.model('Post', postSchema);
