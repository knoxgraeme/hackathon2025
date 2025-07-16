// API configuration - centralizes all API endpoints and keys

export const API_CONFIG = {
  // Supabase configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // For hackathon: hardcoded fallback anon key. In production, use environment variables only
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // API Endpoints
  ELEVENLABS_WEBHOOK_URL: process.env.NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL,
  
  // Feature flags
  ENABLE_IMAGE_GENERATION: process.env.NEXT_PUBLIC_ENABLE_IMAGE_GENERATION === 'true',
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
} as const;

// Helper to validate required config
export function validateConfig() {
  const required = ['SUPABASE_URL'];
  const missing = required.filter(key => !API_CONFIG[key as keyof typeof API_CONFIG]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
}