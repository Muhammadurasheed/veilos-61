const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const expertEarningsSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(),
    unique: true,
    index: true
  },
  expertId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  balance: {
    available: {
      type: Number,
      default: 0 // available for withdrawal in cents
    },
    pending: {
      type: Number,
      default: 0 // pending from recent consultations
    },
    lifetime: {
      type: Number,
      default: 0 // total earned lifetime
    }
  },
  payout: {
    stripeAccountId: String,
    method: {
      type: String,
      enum: ['bank_account', 'debit_card'],
      default: 'bank_account'
    },
    schedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'manual'],
      default: 'weekly'
    },
    minimumAmount: {
      type: Number,
      default: 2000 // $20 minimum withdrawal
    }
  },
  statistics: {
    totalConsultations: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalMinutes: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number,
      default: 0 // average response time in minutes
    },
    completionRate: {
      type: Number,
      default: 100 // percentage of completed vs cancelled sessions
    }
  },
  monthlyStats: [{
    month: String, // YYYY-MM format
    earnings: Number,
    consultations: Number,
    minutes: Number,
    averageRating: Number
  }]
}, {
  timestamps: true
});

// Update statistics when earnings change
expertEarningsSchema.methods.updateStats = function(consultation) {
  this.statistics.totalConsultations += 1;
  this.statistics.totalMinutes += consultation.session.actualDuration || consultation.duration;
  
  // Update monthly stats
  const currentMonth = new Date().toISOString().substring(0, 7);
  let monthlyRecord = this.monthlyStats.find(m => m.month === currentMonth);
  
  if (!monthlyRecord) {
    monthlyRecord = {
      month: currentMonth,
      earnings: 0,
      consultations: 0,
      minutes: 0,
      averageRating: 0
    };
    this.monthlyStats.push(monthlyRecord);
  }
  
  monthlyRecord.earnings += consultation.earnings.expertEarnings;
  monthlyRecord.consultations += 1;
  monthlyRecord.minutes += consultation.session.actualDuration || consultation.duration;
  
  return this.save();
};

module.exports = mongoose.model('ExpertEarnings', expertEarningsSchema);