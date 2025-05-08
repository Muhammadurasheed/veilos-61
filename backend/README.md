
# Veilo Backend API

This document provides an overview of the Veilo backend API structure and how to integrate it with the frontend application.

## Getting Started

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

3. Start MongoDB (locally or using Atlas)

4. Start the server:
   ```
   npm run dev
   ```

## API Endpoints Overview

### Users

- `POST /api/users/register`: Create a new anonymous user
- `POST /api/users/authenticate`: Verify and refresh JWT token
- `GET /api/users/me`: Get current user profile
- `POST /api/users/refresh-identity`: Generate new alias and avatar

### Experts

- `POST /api/experts/register`: Register as an expert
- `POST /api/experts/:id/document`: Upload verification document
- `GET /api/experts`: List all approved experts
- `GET /api/experts/:id`: Get specific expert profile
- `PUT /api/experts/:id`: Update expert profile

### Posts

- `POST /api/posts`: Create a new post
- `GET /api/posts`: Get all posts
- `GET /api/posts/:id`: Get specific post
- `POST /api/posts/:id/like`: Like a post
- `POST /api/posts/:id/unlike`: Unlike a post
- `POST /api/posts/:id/comment`: Comment on a post
- `POST /api/posts/:id/flag`: Flag inappropriate content
- `POST /api/posts/:id/translate`: Translate post content

### Sessions

- `POST /api/sessions`: Request session with expert
- `GET /api/sessions/user/:userId`: Get sessions for a user
- `GET /api/sessions/expert/:expertId`: Get sessions for an expert
- `GET /api/sessions/:id`: Get specific session details
- `POST /api/sessions/:id/status`: Update session status
- `POST /api/sessions/:id/video`: Create video meeting room

### Admin

- `GET /api/admin/experts/unverified`: List unverified experts
- `PATCH /api/admin/experts/:id/verify`: Verify expert account
- `GET /api/admin/flagged`: Get flagged content
- `POST /api/admin/flagged/:id`: Resolve flagged content
- `POST /api/admin/login`: Admin authentication

### Ratings

- `POST /api/ratings`: Rate an expert
- `POST /api/ratings/testimonial`: Add expert testimonial

## Data Models

### User
- Anonymous identity with generated alias
- Optional authentication for returning users
- Role-based access (shadow/beacon/admin)

### Expert
- Professional profile with verification status
- Document verification system
- Rating and testimonial collection

### Post
- Anonymous sharing with emotion tagging
- Content moderation integration
- Multi-language support

### Session
- Different session types (chat/video/voice)
- Scheduling and status management
- Video room integration

## Frontend Integration

To integrate with the frontend:

1. Update the API service files to use the actual endpoints
2. Use JWT tokens for authentication
3. Handle API responses consistently

Example of an updated API call:

```typescript
// Before (mock implementation)
export const getPosts = () => fetchApi<Post[]>('/post')

// After (real implementation)
export const getPosts = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/posts');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch posts');
    }
    
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
```

## Next Steps

1. Deploy the backend to a hosting platform
2. Update the frontend API base URL to point to the deployed backend
3. Implement proper authentication flows
4. Add rate limiting and additional security measures
5. Set up monitoring and logging
