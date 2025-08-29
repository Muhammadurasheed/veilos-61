
import { Post, Expert } from '@/types';

// For development/fallback use only - will be replaced by API calls
export const samplePosts: Post[] = [
  {
    id: '1',
    userId: 'user-1',
    userAlias: 'WiseSoul42',
    userAvatarIndex: 3,
    content: "I've been feeling so disconnected lately. It's like there's this wall between me and everyone else. Does anyone else feel this way? How do you push through it?",
    feeling: 'Disconnected',
    topic: 'Mental Health',
    timestamp: new Date(Date.now() - 8400000).toISOString(),
    likes: ['user-2', 'user-3'],
    comments: [
      {
        id: 'comment-1',
        userId: 'expert-1',
        userAlias: 'Dr. Emma Harris',
        userAvatarIndex: 0,
        isExpert: true,
        expertId: 'expert-1',
        content: "What you're feeling is actually quite common. Disconnection often comes from a place of self-protection. Have you noticed any patterns when this feeling intensifies?",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        languageCode: 'en'
      },
      {
        id: 'comment-2',
        userId: 'user-2',
        userAlias: 'GentleRain33',
        userAvatarIndex: 5,
        isExpert: false,
        content: "I've been there too. For me, small connections helped - just texting a friend about something simple or going for a walk in a busy park. Sometimes just being around people, even without interacting, helps me feel more connected.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        languageCode: 'en'
      }
    ],
    wantsExpertHelp: true,
    languageCode: 'en'
  },
  {
    id: '2',
    userId: 'user-2',
    userAlias: 'GentleRain33',
    userAvatarIndex: 5,
    content: "Does anyone else struggle with setting boundaries with family? I love them but every time I visit, I leave feeling completely drained.",
    feeling: 'Overwhelmed',
    topic: 'Relationships',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    likes: ['user-1', 'user-3', 'user-4'],
    comments: [
      {
        id: 'comment-3',
        userId: 'expert-2',
        userAlias: 'Michael Chen, LMFT',
        userAvatarIndex: 0,
        isExpert: true,
        expertId: 'expert-2',
        content: "Family boundaries can be especially challenging because of the history and expectations. Maybe start small - take short breaks during visits, or have a ready excuse to leave at a specific time. Over time, you can build up to more direct boundaries.",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        languageCode: 'en'
      }
    ],
    wantsExpertHelp: false,
    languageCode: 'en'
  },
  {
    id: '3',
    userId: 'user-3',
    userAlias: 'PeacefulMeadow78',
    userAvatarIndex: 2,
    content: "I finally stood up for myself at work today after months of taking on extra projects without recognition. My heart was racing, but I did it. Small victory, but it feels huge.",
    feeling: 'Proud',
    topic: 'Work',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    likes: ['user-1', 'user-4', 'user-5'],
    comments: [],
    wantsExpertHelp: false,
    languageCode: 'en'
  }
];

export const sampleExperts: Expert[] = [
  {
    id: 'expert-7zZgxwFk',
    userId: 'user-expert-1',
    name: 'James S',
    email: 'james@veilo.com',
    avatarUrl: '/experts/expert-1.jpg',
    specialization: 'Mental Health Counselor',
    verificationLevel: 'platinum',
    bio: 'Licensed mental health counselor with over 10 years of experience in anxiety, depression, and trauma therapy. I believe in creating a safe, non-judgmental space for healing.',
    pricingModel: 'donation',
    pricingDetails: '$75/hour - Professional therapy sessions with flexible payment options',
    rating: 4.8,
    testimonials: [],
    topicsHelped: ['Anxiety', 'Depression', 'Trauma', 'Relationship Issues'],
    verified: true,
    accountStatus: 'approved',
    totalRatings: 47,
    totalSessions: 156,
    completedSessions: 149,
    profileViews: 1240,
    profileViewsThisMonth: 89,
    followersCount: 234,
    lastUpdated: '2024-03-15T10:30:00Z',
    createdAt: '2023-01-15T08:00:00Z'
  },
  {
    id: 'expert-t9Im9JCJ',
    userId: 'user-expert-2',
    name: 'Sarah Johnson',
    email: 'sarah@veilo.com',
    avatarUrl: '/experts/expert-2.jpg',
    specialization: 'Life Coach & Therapist',
    verificationLevel: 'gold',
    bio: 'Certified life coach and therapist helping people overcome obstacles and achieve their personal goals.',
    pricingModel: 'free',
    pricingDetails: 'Free initial consultation',
    rating: 4.6,
    testimonials: [],
    topicsHelped: ['Life Coaching', 'Goal Setting', 'Career Development', 'Self Improvement'],
    verified: true,
    accountStatus: 'approved',
    totalRatings: 23,
    totalSessions: 78,
    completedSessions: 71,
    profileViews: 890,
    profileViewsThisMonth: 45,
    followersCount: 156,
    lastUpdated: '2024-03-10T14:20:00Z',
    createdAt: '2023-06-20T09:30:00Z'
  }
];
