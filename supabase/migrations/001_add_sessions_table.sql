-- Add sessions table migration
-- This migration creates a sessions table that matches the current Session interface
-- from app/providers/SessionProvider.tsx

-- Enable UUID extension for session IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table
CREATE TABLE sessions (
    -- Primary key matching the current string ID format
    id TEXT PRIMARY KEY,
    
    -- Session lifecycle status with constraint
    status TEXT NOT NULL CHECK (status IN ('initial', 'conversation', 'processing', 'complete')),
    
    -- Optional conversation ID from ElevenLabs
    conversation_id TEXT,
    
    -- Photography context stored as JSONB for flexibility
    context JSONB,
    
    -- Location suggestions stored as JSONB array
    locations JSONB,
    
    -- Shot suggestions stored as JSONB array  
    shots JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Optional human-readable title
    title TEXT
);
