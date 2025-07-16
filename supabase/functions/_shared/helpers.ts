// Shared helper functions for Supabase Edge Functions

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
 * CORS headers for Supabase edge functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Standard error response with CORS headers
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
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

/**
 * Standard success response with CORS headers
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
        ...corsHeaders,
        ...headers
      }
    }
  );
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

/**
 * Extract conversation ID from request body
 */
export async function extractConversationIdFromRequest(req: Request): Promise<string | null> {
  try {
    const body = await req.json();
    
    if (typeof body === 'string') {
      return body;
    }
    
    if (body && typeof body === 'object' && 'conversationId' in body) {
      return body.conversationId || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate required environment variables for Deno
 */
export function validateEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}