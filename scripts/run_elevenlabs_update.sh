#!/bin/bash

# Load environment variables from .env.local
export $(cat .env.local | grep ELEVEN_LABS_API_KEY | xargs)

# Run the Node script
node scripts/update_elevenlabs_agent.js