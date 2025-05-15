/**
 * Types for application routes
 */

// Auth related routes
export type AuthRoutes = 
  | '/(auth)/sign-in'
  | '/(auth)/sign-up'
  | '/(auth)/forgot-password'
  | '/(auth)/email-sign-in'
  | '/(auth)/email-sign-up';

// Onboarding related routes
export type OnboardingRoutes = 
  | '/(onboarding)/welcome'
  | '/(onboarding)/language-selection'
  | '/(onboarding)/dialect-selection'
  | '/(onboarding)/arabic-learning-source';

// Root routes
export type RootRoutes = 
  | '/'
  | '/profile'
  | '/learn'
  | '/conversation';

// All app routes
export type AppRoutes = AuthRoutes | OnboardingRoutes | RootRoutes; 