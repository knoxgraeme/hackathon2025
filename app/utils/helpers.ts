// Utility helper functions shared across the application

/**
 * Safely parse JSON response from AI models
 * Handles markdown code blocks and other formatting issues
 */
export function parseJsonResponse<T = any>(text: string): T {
  try {
    // Remove markdown code blocks and trim
    const cleanedText = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Original text:', text);
    throw new Error('Invalid JSON response from AI model');
  }
}

/**
 * Standard error response format for edge functions
 */
export function createErrorResponse(
  message: string, 
  status: number = 500,
  details?: any
): Response {
  console.error(`Error [${status}]:`, message, details);
  
  return new Response(
    JSON.stringify({ 
      error: message,
      details: details || undefined 
    }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Standard success response format for edge functions
 */
export function createSuccessResponse<T = any>(
  data: T,
  headers?: HeadersInit
): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}

/**
 * Extract conversation ID from various formats
 */
export function extractConversationId(input: string | { conversationId?: string } | any): string | null {
  if (typeof input === 'string') {
    return input;
  }
  
  if (input && typeof input === 'object' && 'conversationId' in input) {
    return input.conversationId || null;
  }
  
  return null;
}

/**
 * Retry logic for API calls
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Validate required environment variables
 */
export function validateEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Safe console logging with environment check
 */
export function debugLog(...args: any[]) {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}