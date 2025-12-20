# Social Login Integration Guide

## Overview
This guide will help you set up social login (Google, Facebook, Apple, etc.) using Clerk.

## Setup Steps

### 1. Enable Social Providers in Clerk Dashboard

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to "User & Authentication" > "Social Connections"
4. Enable the desired providers:
   - **Google**: Most recommended, easiest to set up
   - **Facebook**: Good for social engagement
   - **Apple**: Required for iOS apps
   - **GitHub**: Popular for developer tools
   - **Microsoft**: Good for enterprise users

### 2. Configure Each Provider

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: Add Clerk's callback URL (from Clerk dashboard)
5. Copy Client ID and Client Secret to Clerk dashboard

#### Facebook OAuth Setup:
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app or select existing
3. Add Facebook Login product
4. Configure OAuth redirect URIs with Clerk's callback URL
5. Copy App ID and App Secret to Clerk dashboard

#### Apple OAuth Setup:
1. Go to [Apple Developer](https://developer.apple.com)
2. Create a Service ID
3. Configure Sign in with Apple
4. Add Clerk's callback URL to Return URLs
5. Copy Service ID and configure Team ID in Clerk dashboard

### 3. Clerk Configuration

Your existing Clerk setup already supports social login. Just enable it in the dashboard and the `<SignIn>` and `<SignUp>` components will automatically show social login buttons.

### 4. Customize Social Login UI

The social login buttons are automatically added to your sign-in and sign-up pages at:
- `/sign-in`
- `/sign-up`

Clerk's components handle all the OAuth flows automatically.

### 5. Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 6. Additional User Data

After social login, you can access user data:

```javascript
import { useUser } from '@clerk/nextjs';

const { user } = useUser();
// user.emailAddresses[0].emailAddress
// user.imageUrl
// user.firstName
// user.lastName
```

### 7. Testing

1. Enable at least one social provider in Clerk dashboard
2. Visit `/sign-in` or `/sign-up`
3. Click on the social provider button
4. Complete OAuth flow
5. User will be automatically signed in

## Benefits of Social Login

✅ **Faster Registration**: Users can sign up in seconds
✅ **Better Conversion**: Reduces friction in signup process
✅ **Trusted Verification**: Email verification handled by provider
✅ **Profile Data**: Get name, email, and profile picture automatically
✅ **Security**: OAuth 2.0 standard security
✅ **No Password Management**: Users don't need to remember passwords

## Already Implemented

Your app already has:
- Clerk authentication setup
- Sign-in and sign-up pages
- User session management
- Protected routes

**You just need to enable social providers in the Clerk dashboard - no code changes required!**
