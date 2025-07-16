// Script to update ElevenLabs agent data extraction properties
// Agent ID: agent_01k0616fckfdzrnt2g2fwq2r2h

const AGENT_ID = 'agent_01k0616fckfdzrnt2g2fwq2r2h';
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Define the structured data properties for extraction (max 15 fields)
const dataExtractionProperties = {
  // Location & Timing
  location: {
    type: "string",
    description: "City or venue name where the shoot will take place",
    dynamic_variable: "location"
  },
  date: {
    type: "string", 
    description: "Shoot date in YYYY-MM-DD format",
    dynamic_variable: "date"
  },
  startTime: {
    type: "string",
    description: "Start time in HH:MM format (24-hour)",
    dynamic_variable: "start_time"
  },
  duration: {
    type: "string",
    description: "Total duration (e.g., '2 hours', '90 minutes')",
    dynamic_variable: "duration"
  },
  
  // Shoot Type & Style
  shootType: {
    type: "string",
    description: "Type of shoot: wedding, portrait, engagement, event, product, or other",
    dynamic_variable: "shoot_type"
  },
  mood: {
    type: "string",
    description: "2-3 mood descriptors separated by commas (e.g., 'romantic, candid')",
    dynamic_variable: "mood"
  },
  
  // Subject Information
  primarySubjects: {
    type: "string",
    description: "Main subjects: names, relationship (couple/family/etc), and count",
    dynamic_variable: "primary_subjects"
  },
  secondarySubjects: {
    type: "string",
    description: "Secondary subjects if any (pets, family members, etc.)",
    dynamic_variable: "secondary_subjects"
  },
  
  // Logistics
  locationPreference: {
    type: "string",
    description: "Location preference: clustered (close together) or itinerary (spread out)",
    dynamic_variable: "location_preference"
  },
  mustHaveShots: {
    type: "string",
    description: "Specific requested shots separated by semicolons",
    dynamic_variable: "must_have_shots"
  },
  specialRequirements: {
    type: "string",
    description: "Special requirements: mobility needs, permits, props, or equipment",
    dynamic_variable: "special_requirements"
  },
  
  // Photographer Experience
  experience: {
    type: "string",
    description: "Photographer experience level: beginner, intermediate, or professional",
    dynamic_variable: "experience"
  }
};

// Function to update agent via ElevenLabs API
async function updateAgent() {
  if (!API_KEY) {
    console.error('Please set ELEVEN_LABS_API_KEY environment variable in .env.local');
    console.error('Current env vars:', Object.keys(process.env).filter(k => k.includes('ELEVEN')));
    process.exit(1);
  }

  try {
    // Convert properties to the format expected by the API
    const formattedProperties = Object.entries(dataExtractionProperties).map(([key, value]) => ({
      name: key,
      ...value
    }));

    // Prepare the update payload with the correct structure
    // ElevenLabs expects only description to be set for data collection
    const dataCollection = {};
    formattedProperties.forEach(prop => {
      dataCollection[prop.name] = {
        type: prop.type,
        description: prop.description,
        dynamic_variable: "",
        constant_value: ""
      };
    });

    const updatePayload = {
      platform_settings: {
        data_collection: dataCollection
      },
      conversation_config: {
        agent: {
          first_message: "Hey there! I'm StoryboardAI, your photo shoot planner. I'll help you create an amazing shot list in just a few minutes. First up - where's this shoot happening?"
        }
      }
    };

    console.log('Updating agent with data collection fields:', Object.keys(dataCollection).join(', '));

    // Make the API call to update the agent
    // Using the correct ElevenLabs API endpoint for conversational AI agents
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      },
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update agent: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('✅ Agent updated successfully!');
    console.log('Updated properties:', formattedProperties.map(p => p.name).join(', '));
    
    return result;
  } catch (error) {
    console.error('❌ Error updating agent:', error.message);
    process.exit(1);
  }
}

// Run the update
updateAgent();

// Example usage:
// node scripts/update_elevenlabs_agent.js
// (Reads from .env.local automatically)