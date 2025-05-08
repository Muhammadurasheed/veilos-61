
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
      },
      {
        id: 'comment-2',
        userId: 'user-2',
        userAlias: 'GentleRain33',
        userAvatarIndex: 5,
        content: "I've been there too. For me, small connections helped - just texting a friend about something simple or going for a walk in a busy park. Sometimes just being around people, even without interacting, helps me feel more connected.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      }
    ]
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
      }
    ]
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
    comments: []
  }
];

export const sampleExperts: Expert[] = [
  {
    id: 'expert-1',
    name: 'Dr. Emma Harris',
    avatarUrl: '/experts/expert-1.jpg',
    specialization: 'Clinical Psychologist',
    verificationLevel: 'platinum',
    bio: 'Specializing in anxiety, depression, and trauma recovery. My approach combines cognitive behavioral therapy with mindfulness practices.',
    pricingModel: 'fixed',
    pricingDetails: 'Sliding scale available',
    rating: 4.9,
    testimonials: [
      {
        id: 'test-1',
        text: 'Dr. Harris helped me understand my anxiety in a way that finally made sense. Her gentle guidance has been transformative.',
        user: {
          alias: 'SilentWind67',
          avatarIndex: 4
        }
      },
      {
        id: 'test-2',
        text: 'I felt truly heard for the first time. Dr. Harris created such a safe space for me to explore difficult emotions.',
        user: {
          alias: 'PeacefulMeadow78',
          avatarIndex: 2
        }
      }
    ],
    topicsHelped: ['Anxiety', 'Depression', 'Trauma', 'Self-esteem'],
    verified: true,
    accountStatus: 'approved'
  },
  {
    id: 'expert-2',
    name: 'Michael Chen, LMFT',
    avatarUrl: '/experts/expert-2.jpg',
    specialization: 'Family Therapist',
    verificationLevel: 'gold',
    bio: 'Helping individuals and families navigate relationship challenges. I believe in the power of healthy connections to transform lives.',
    pricingModel: 'free',
    pricingDetails: 'Free initial consultation',
    rating: 4.8,
    testimonials: [
      {
        id: 'test-3',
        text: 'Michael helped me repair my relationship with my teenage daughter. His strategies for communication were simple but powerful.',
        user: {
          alias: 'GentleRain33',
          avatarIndex: 5
        }
      }
    ],
    topicsHelped: ['Family Conflict', 'Communication Skills', 'Parenting', 'Couples Therapy'],
    verified: true,
    accountStatus: 'approved'
  },
  {
    id: 'expert-3',
    name: 'Sophia Williams',
    avatarUrl: '/experts/expert-3.jpg',
    specialization: 'Grief Counselor',
    verificationLevel: 'blue',
    bio: 'Supporting people through grief and loss. Certified in trauma-informed care and mindfulness-based grief therapy.',
    pricingModel: 'donation',
    pricingDetails: 'Pay what you can',
    rating: 5.0,
    testimonials: [
      {
        id: 'test-4',
        text: 'Sophia gave me permission to grieve in my own way. Her compassion created space for healing I didn\'t think was possible.',
        user: {
          alias: 'DreamyLight29',
          avatarIndex: 7
        }
      }
    ],
    topicsHelped: ['Grief', 'Loss', 'Life Transitions', 'Healing'],
    verified: true,
    accountStatus: 'approved'
  }
];
