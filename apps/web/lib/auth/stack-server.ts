import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: {
    signIn: '/login',
    signUp: '/signup',
    forgotPassword: '/forgot-password',
    afterSignIn: '/dashboard',
    afterSignUp: '/onboarding',
    afterSignOut: '/login',
  },
});
