// Script to fetch current ElevenLabs agent configuration
// This helps us understand the correct API structure

const AGENT_ID = 'agent_01k0616fckfdzrnt2g2fwq2r2h';
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

async function getAgent() {
  if (!API_KEY) {
    console.error('Please set ELEVEN_LABS_API_KEY environment variable');
    process.exit(1);
  }

  console.log('Fetching agent configuration...');
  
  // Try different possible endpoints
  const endpoints = [
    `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
    `https://api.elevenlabs.io/v1/agents/${AGENT_ID}`,
    `https://api.elevenlabs.io/v1/conversational-ai/agents/${AGENT_ID}`
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'xi-api-key': API_KEY
        }
      });

      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Agent configuration:');
        console.log(JSON.stringify(data, null, 2));
        
        // Look for data extraction configuration
        if (data.conversation_config) {
          console.log('\n📋 Current conversation config:');
          console.log(JSON.stringify(data.conversation_config, null, 2));
        }
        
        return data;
      } else {
        const error = await response.text();
        console.log(`❌ Failed: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ Could not find agent with any endpoint');
}

getAgent();