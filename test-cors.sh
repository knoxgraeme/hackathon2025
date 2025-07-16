#!/bin/bash

echo "Testing CORS with preflight request..."
curl -X OPTIONS \
  https://akukmblllfqvoibrvrie.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v

echo -e "\n\nTesting actual POST request..."
curl -X POST \
  https://akukmblllfqvoibrvrie.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdWttYmxsbGZxdm9pYnJ2cmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTk3NzAsImV4cCI6MjA2ODE5NTc3MH0.76Um3tnXfezwfXXFesU-LqpDabAG9GAAWbJPP11kMdc" \
  -d '{"stage": "full", "mockContext": "portrait"}' \
  -v