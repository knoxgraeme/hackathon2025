// app/providers/SessionProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { EdgePhotoShootContext, EdgeLocation, EdgeShot } from '../types/photo-session';
import { supabase } from '../lib/supabase';

/**
 * Default session to seed the app with example data
 * This provides users with a comprehensive example to explore
 */
const VANCOUVER_DEFAULT_SESSION: Session = {
  id: "session-1752857576488-g7nfrr622",
  status: "complete",
  createdAt: "2025-07-18T16:52:56.488Z",
  title: "Stanley Park, Vancouver Wedding",
  conversationId: "conv_01k0f784k9ec5vvxy7cgajgath",
  context: {
    shootType: "wedding",
    mood: ["joyful", "candid"],
    timeOfDay: "flexible",
    subject: "wedding", 
    duration: "2 hours",
    equipment: [],
    experience: "intermediate",
    specialRequests: "",
    location: "Stanley Park, Vancouver",
    date: "flexible",
    startTime: "flexible",
    locationPreference: "clustered"
  },
  locations: [
    {
      accessibility: "Paved and gravel paths, generally wheelchair accessible. Some grassy areas may be uneven.",
      address: "610 Pipeline Rd, Vancouver, BC V6G 1Z4 (specific section within)",
      alternatives: [
        "Ted and Mary Greig Rhododendron Garden (within Stanley Park, seasonal bloom)",
        "VanDusen Botanical Garden (requires admission/permits)",
        "Queen Elizabeth Park Bloedel Conservatory gardens (requires admission/permits)"
      ],
      bestTime: "Morning (9-11 AM) for soft, directional light and fewer crowds. Late afternoon (4-6 PM) for golden hour, but expect more people.",
      description: "A beautiful, well-maintained rose garden with various species, featuring elegant arched pergolas covered in climbing roses and winding paths. Ideal for classic, romantic, and joyful shots.",
      lightingNotes: "Open sky can be harsh midday; seek shade under trees or pergolas for softer light. Dappled light filtering through rose bushes and arches is lovely.",
      name: "Stanley Park Rose Garden - Arched Pergola & Secluded Paths",
      permits: "Generally no permit required for casual photography. Large commercial setups might need one."
    },
    {
      accessibility: "Uneven dirt path, potential for roots. Not wheelchair accessible. Moderate mobility required.",
      address: "Off Pipeline Rd, just past the Rose Garden/Pavilion, Vancouver, BC V6G 1Z4",
      alternatives: [
        "Bridle Path (deeper within Stanley Park)",
        "Seva Street forest trails (South Vancouver)"
      ],
      bestTime: "Mid-morning to early afternoon (10 AM - 3 PM) for beautiful dappled light filtering through the canopy.",
      description: "A less-trafficked natural dirt path winding through tall, dense trees at the edge of the forest near Malkin Bowl. Offers a contrasting natural, secluded, and intimate feel for candid moments.",
      lightingNotes: "Excellent for soft, natural light, especially on sunny days creating beautiful light patterns and bokeh. Overcast days provide diffused, even light.",
      name: "Malkin Bowl Forest Edge Path",
      permits: "No permit required for casual photography."
    },
    {
      accessibility: "Paved pathways around the lagoon are wheelchair accessible. The pedestrian bridge has ramps.",
      address: "Stanley Park Drive (near Georgia St entrance), Vancouver, BC V6G 1Z4",
      alternatives: [
        "Beaver Lake (within Stanley Park, more secluded)",
        "Jericho Beach Pond (further away, West Vancouver)"
      ],
      bestTime: "Early morning (sunrise to 9 AM) for mist and calm waters, or late afternoon/sunset for golden hour reflections and a serene mood.",
      description: "The tranquil waters of Lost Lagoon, featuring a charming pedestrian bridge and often a small gazebo or reflective spots. Provides calm water reflections and a serene, open feel, great for joyful strolling shots.",
      lightingNotes: "Open water means bright reflections. Position subjects with the sun behind them (backlit) or during softer light hours to avoid harsh shadows. Look for reflections on the water's surface.",
      name: "Lost Lagoon Pedestrian Bridge & Gazebo Area",
      permits: "No permit required for casual photography."
    },
    {
      accessibility: "Paved, flat Seawall path, fully wheelchair accessible.",
      address: "Stanley Park Dr, Vancouver, BC V6G 1Z4 (near Lumberman's Arch)",
      alternatives: [
        "Seawall near Siwash Rock (further west, more rugged coast)",
        "Coal Harbour Seawall (downtown Vancouver, more urban skyline)",
        "Jericho Beach (West Vancouver, sandy beach views)"
      ],
      bestTime: "Late afternoon for beautiful light on the North Shore mountains and water, or early morning for fewer crowds and soft, expansive light.",
      description: "A scenic stretch of the famous Stanley Park Seawall, offering expansive views of the Burrard Inlet, distant North Shore mountains, and passing boats. Great for iconic Vancouver backdrops and a sense of open freedom.",
      lightingNotes: "Open and can be very bright. Utilize open shade if available or shoot away from direct sun. Overcast days provide excellent diffused light for the wide-open views and water.",
      name: "Stanley Park Seawall - Lumberman's Arch Stretch",
      permits: "No permit required for casual photography."
    }
  ],
  shots: [
    {
      shotNumber: 1,
      locationIndex: 0,
      location: "Stanley Park Rose Garden - Arched Pergola & Secluded Paths",
      idealLighting: "Morning (9-11 AM) or late afternoon (4-6 PM) for soft, directional light",
      title: "Rose Garden Pergola Embrace - Stanley Park Rose Garden",
      imagePrompt: "Joyful, romantic, embrace, rose garden, pergola, soft light",
      composition: "Medium shot of the couple under an arched pergola, surrounded by climbing roses. They are embracing, looking into each other's eyes, a soft smile on their faces. The pergola frames them, and the background is softly blurred with rose blooms.",
      direction: "Encourage the couple to embrace naturally. Ask them to look at each other and share a quiet, joyful moment. Remind them to breathe and enjoy the space. Direct slight head tilts for optimal light.",
      technical: "Aperture: f/2.0-2.8 for soft background bokeh. Shutter Speed: 1/250s+. ISO: 100-400. Lens: 50mm or 85mm prime lens. Lighting: Utilize the soft, filtered light under the pergola. Position subjects to avoid harsh shadows, possibly backlit slightly by the sun filtering through.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "50mm f/1.4 or 85mm f/1.4 prime lens",
        "Reflector (silver/white side for fill, if needed)",
        "Lens hood"
      ],
      poses: "Embracing, looking into each other's eyes, soft smiles, relaxed posture.",
      blocking: "Couple centered under the archway, facing each other, with one slightly turning into the other's embrace. Minimal movement.",
      communicationCues: "Engage, connect, embrace, breathe, share a quiet moment.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-1-2025-07-18T16-54-09-098Z.jpg"
    },
    {
      shotNumber: 2,
      locationIndex: 0,
      location: "Stanley Park Rose Garden - Arched Pergola & Secluded Paths",
      idealLighting: "Morning (9-11 AM) or late afternoon (4-6 PM) for soft, directional light",
      title: "Candid Stroll on Secluded Rose Path - Stanley Park Rose Garden",
      imagePrompt: "Candid, joyful, strolling, rose path, laughter, movement",
      composition: "Full shot of the couple walking hand-in-hand down a winding, secluded path through the rose garden. Their backs are slightly turned as they walk away, looking back over their shoulders at the camera with genuine laughter. The path leads into soft focus roses.",
      direction: "Ask the couple to walk naturally, chatting and laughing. Encourage them to interact with each other. Provide prompts like 'Tell each other your favorite memory from today!' to elicit genuine reactions. Shoot in bursts to capture peak expressions.",
      technical: "Aperture: f/3.2-4.0 for a bit more environmental context. Shutter Speed: 1/500s+ to freeze motion. ISO: Auto. Lens: 35mm or 50mm prime. Lighting: Seek dappled light filtering through trees or even diffused light on an overcast day. Position subjects so the light catches their faces as they look back.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "35mm f/1.4 or 50mm f/1.4 prime lens",
        "Speedlight (off-camera, if needed for fill in challenging light)",
        "Wireless trigger"
      ],
      poses: "Walking hand-in-hand, looking back over shoulder, genuine laughter, relaxed body language.",
      blocking: "Couple walks slowly away from camera down the path, then turns heads back towards camera.",
      communicationCues: "Walk naturally, chat, laugh, 'Look back at me!', 'Share a secret!'",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-2-2025-07-18T16-54-04-016Z.jpg"
    },
    {
      shotNumber: 3,
      locationIndex: 1,
      location: "Malkin Bowl Forest Edge Path",
      idealLighting: "Mid-morning to early afternoon (10 AM - 3 PM) for dappled light",
      title: "Intimate Forest Edge Embrace - Malkin Bowl Forest Edge Path",
      imagePrompt: "Intimate, secluded, soft, forest, embrace, dappled light",
      composition: "Medium close-up of the couple standing intimately amidst the tall, dense trees. One partner is gently holding the other's face, or they are in a soft embrace, eyes closed or gazing at each other. Focus on their connection, with the beautiful dappled light creating patterns on them and the background providing natural bokeh.",
      direction: "Create a sense of quiet intimacy. Ask the couple to connect without words, just through touch and gaze. Guide them into a soft, gentle embrace. Point out the beautiful light and encourage them to feel the peacefulness of the forest. 'Just be yourselves, in this beautiful quiet moment.'",
      technical: "Aperture: f/1.8-2.5 for strong subject separation and creamy bokeh. Shutter Speed: 1/200s+. ISO: 200-800, adjusting for light. Lens: 85mm or 105mm prime lens. Lighting: Utilize the beautiful dappled light filtering through the canopy. Position subjects to catch soft pools of light on their faces, or use backlight for rim lighting.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "85mm f/1.4 or 105mm f/1.4 prime lens",
        "Reflector (small, for subtle fill, if necessary)",
        "Lens hood"
      ],
      poses: "Soft embrace, hands on face/waist, eyes closed or gazing, relaxed and tender.",
      blocking: "Couple standing close together, slightly off-center in the frame, surrounded by trees. Minimal movement.",
      communicationCues: "Connect, be present, gentle touch, feel the quiet, 'Just you two'.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-3-2025-07-18T16-54-07-828Z.jpg"
    },
    {
      shotNumber: 4,
      locationIndex: 1,
      location: "Malkin Bowl Forest Edge Path",
      idealLighting: "Mid-morning to early afternoon (10 AM - 3 PM) for dappled light",
      title: "Candid Forest Walk with Dappled Light - Malkin Bowl Forest Edge Path",
      imagePrompt: "Candid, walking, forest path, genuine, joyful, dappled light",
      composition: "Full body shot of the couple walking away from the camera along the winding dirt path, hands clasped. They are looking back at each other and smiling or laughing. The path recedes into the soft focus of the forest, with streaks of dappled sunlight creating a magical atmosphere.",
      direction: "Instruct the couple to walk as if they're on a leisurely stroll. Encourage natural conversation and laughter. 'Pretend I'm not here, just enjoy your walk together!' Capture motion with a slightly faster shutter speed. Look for moments where the light hits them perfectly.",
      technical: "Aperture: f/2.8-4.0 to capture more of the path and light patterns. Shutter Speed: 1/400s+ to freeze motion while maintaining some fluidity. ISO: Auto. Lens: 35mm or 50mm prime. Lighting: Leverage the natural dappled light; position subjects so they walk through patches of light and shadow, highlighting their movement and interaction.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "35mm f/1.4 or 50mm f/1.4 prime lens",
        "Monopod (optional, for stability in lower light)",
        "Lens hood"
      ],
      poses: "Walking hand-in-hand, looking at each other, genuine smiles/laughter, relaxed stride.",
      blocking: "Couple walks away from the camera along the path, looking back at each other.",
      communicationCues: "Walk naturally, chat, laugh together, 'Just enjoy your walk'.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-4-2025-07-18T16-54-05-933Z.jpg"
    },
    {
      shotNumber: 5,
      locationIndex: 2,
      location: "Lost Lagoon Pedestrian Bridge & Gazebo Area",
      idealLighting: "Early morning (sunrise to 9 AM) or late afternoon/sunset for golden hour",
      title: "Joyful Stroll on Lost Lagoon Bridge - Lost Lagoon Pedestrian Bridge",
      imagePrompt: "Joyful, strolling, bridge, Lost Lagoon, reflection, serene",
      composition: "Full shot of the couple playfully walking across the pedestrian bridge. They could be skipping, doing a little dance, or simply walking hand-in-hand, looking out at the lagoon. The serene waters of Lost Lagoon are in the background, offering soft reflections of the sky and trees.",
      direction: "Encourage joyful movement and interaction. 'Let's see your happiest walk across the bridge!' 'Look at each other, soak in this moment!' Position them to have the best reflections in the water behind them. Aim for clean lines of the bridge railing leading the eye to them.",
      technical: "Aperture: f/4.0-5.6 for more depth of field, showcasing the bridge and reflections. Shutter Speed: 1/320s+ to capture joyful movement. ISO: 100-400. Lens: 24-70mm f/2.8 zoom or 35mm prime. Lighting: Early morning or late afternoon for soft, diffused light or golden hour reflections. Backlight if shooting towards the sun, or even light on overcast days.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "24-70mm f/2.8 zoom lens",
        "Circular Polarizer (CPL) filter (to enhance reflections or reduce glare)",
        "Tripod (for potential longer exposure on water, not for this shot)"
      ],
      poses: "Walking hand-in-hand, skipping, dancing, looking at each other or out at the water, joyful expressions.",
      blocking: "Couple walks from one end of the bridge to the other, away from or towards the camera.",
      communicationCues: "Playful, joyful, skip, dance, 'Look out at the water!', 'Enjoy this view!'",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-5-2025-07-18T16-54-06-688Z.jpg"
    },
    {
      shotNumber: 6,
      locationIndex: 2,
      location: "Lost Lagoon Pedestrian Bridge & Gazebo Area",
      idealLighting: "Early morning (sunrise to 9 AM) or late afternoon/sunset for golden hour",
      title: "Serene Gazebo Reflection - Lost Lagoon Gazebo Area",
      imagePrompt: "Serene, intimate, reflection, gazebo, Lost Lagoon, calm water",
      composition: "Medium wide shot of the couple standing within or near the small gazebo, with the tranquil waters of Lost Lagoon prominently featured in the foreground and background, showing clear reflections. They are in a quiet embrace or standing side-by-side, gazing out at the water, creating a peaceful, contemplative mood.",
      direction: "Set a calm and peaceful mood. 'Take a deep breath, just enjoy the stillness of the water.' Guide them into a gentle, natural pose looking out. Wait for perfectly calm water for the best reflections. Emphasize the serene atmosphere.",
      technical: "Aperture: f/2.8-4.0 for subject separation but still showing environment. Shutter Speed: 1/160s+. ISO: 100-400. Lens: 50mm or 35mm prime. Lighting: Look for soft, even light. If backlighting, use a reflector or fill flash to expose faces. Early morning for mist or late afternoon for golden hour reflections are ideal.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "50mm f/1.4 or 35mm f/1.4 prime lens",
        "Reflector (silver/white)",
        "Lens hood"
      ],
      poses: "Gentle embrace, standing side-by-side looking out, contemplative, relaxed.",
      blocking: "Couple positioned within or immediately next to the gazebo, facing the water.",
      communicationCues: "Peaceful, calm, 'Look out at the water', 'Feel the tranquility'.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-6-2025-07-18T16-54-06-502Z.jpg"
    },
    {
      shotNumber: 7,
      locationIndex: 3,
      location: "Stanley Park Seawall - Lumberman's Arch Stretch",
      idealLighting: "Late afternoon or early morning for best light on mountains and water",
      title: "Iconic Seawall Vista - Stanley Park Seawall",
      imagePrompt: "Expansive, iconic, seawall, mountains, Burrard Inlet, freedom",
      composition: "Wide-angle shot of the couple standing on the Stanley Park Seawall, with an expansive view of the Burrard Inlet and the North Shore mountains in the background. The couple can be holding hands, looking out at the view, appearing small in the frame to emphasize the grandeur of the landscape.",
      direction: "Position the couple to make the most of the iconic Vancouver backdrop. Encourage them to take in the view, 'Imagine this is your future, vast and beautiful.' Use leading lines of the seawall. Wait for a moment with interesting boat traffic or cloud formations if possible.",
      technical: "Aperture: f/8.0-11.0 for maximum depth of field, ensuring mountains and water are sharp. Shutter Speed: 1/250s+. ISO: 100-200. Lens: 16-35mm wide-angle zoom. Lighting: Late afternoon for warm light on mountains. Overcast days provide excellent diffused light for wide views. Position subjects with sun behind them for dramatic effect or seek open shade.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "16-35mm f/2.8 wide-angle zoom lens",
        "ND filter (if shooting during bright midday sun to reduce glare)",
        "Circular Polarizer (CPL) filter"
      ],
      poses: "Standing side-by-side, holding hands, looking out at the view, arms around each other.",
      blocking: "Couple positioned towards the edge of the seawall, facing out towards the water and mountains.",
      communicationCues: "Take in the view, 'Imagine your future', feel the freedom, 'Soak it all in'."
    },
    {
      shotNumber: 8,
      locationIndex: 3,
      location: "Stanley Park Seawall - Lumberman's Arch Stretch",
      idealLighting: "Late afternoon or early morning for best light on mountains and water",
      title: "Joyful Seawall Stroll - Stanley Park Seawall",
      imagePrompt: "Joyful, candid, strolling, seawall, wind, laughter",
      composition: "Medium to full shot of the couple walking along the seawall, perhaps arm in arm or with hands linked, laughing and enjoying the fresh air. Capture movement and interaction, with the water and distant mountains blurring slightly in the background. The wind catching hair adds to the candid feel.",
      direction: "Encourage natural interaction and movement. 'Just walk and chat as if you're on a morning walk together.' 'Let the wind play with your hair!' Capture genuine expressions of joy and ease. Shoot in continuous mode to get the perfect moment.",
      technical: "Aperture: f/4.0-5.6 for a balance of subject and environment. Shutter Speed: 1/500s+ to freeze motion. ISO: 100-400. Lens: 35mm or 50mm prime. Lighting: Open, bright light. Use open shade if available, or shoot with subjects back to the sun for rim light, using a reflector for fill. Overcast is ideal for even light.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "35mm f/1.4 or 50mm f/1.4 prime lens",
        "Reflector (white/silver)",
        "Lens hood"
      ],
      poses: "Walking arm-in-arm, hands linked, looking at each other or out, laughing, relaxed stride.",
      blocking: "Couple walks along the seawall, either towards, away, or parallel to the camera.",
      communicationCues: "Walk naturally, chat, laugh, 'Feel the breeze', 'Enjoy this moment together'."
    }
  ]
}

const TOKYO_DEFAULT_SESSION: Session = {
  "id": "session-1752867519849-nmnfsa0a2",
  "status": "complete", 
  "createdAt": "2025-07-18T19:38:39.849Z",
  "title": "Tokyo Wedding",
  "conversationId": "conv_01k0fgqhp4emv828j12jxrhhrg",
  "context": {
    "shootType": "wedding",
    "mood": [
      "joyful",
      "candid"
    ],
    "timeOfDay": "daytime",
    "subject": "wedding",
    "duration": "2 hours",
    "equipment": [],
    "experience": "intermediate",
    "specialRequests": "",
    "location": "Tokyo",
    "date": "flexible",
    "startTime": "flexible",
    "locationPreference": "clustered"
  },
  "locations": [
    {
      "accessibility": "Mostly flat cobblestone streets, some slight inclines. Wheelchair accessible in wider main streets but less so in narrow alleys.",
      "address": "Kagurazaka, Shinjuku, Tokyo (specific alleys like Hyogo Yokocho, Kakurenbo Yokocho)",
      "alternatives": [
        "Ningyocho (similar old Tokyo vibe, but more bustling)",
        "Monzen-nakacho (less known, with temples and canals)"
      ],
      "bestTime": "Morning (for fewer crowds) or late afternoon/golden hour (for beautiful light).",
      "description": "A charming historical district with stone-paved alleys, traditional Japanese wooden houses, hidden shrines, and a touch of French influence. Perfect for intimate, candid, joyful strolls.",
      "lightingNotes": "Narrow alleys create interesting light and shadow. Direct sun can be harsh at midday but provides strong contrasts. Golden hour is ideal for soft, warm light.",
      "name": "Kagurazaka Alleys and Streets",
      "permits": "Generally no permits required for personal photography on public streets. Be respectful of private property and local businesses."
    },
    {
      "accessibility": "Yanaka Ginza is flat and walkable. Cemetery paths are generally paved and flat, but some parts have uneven ground.",
      "address": "Yanaka, Taito, Tokyo (Yanaka Ginza, Tennoji Temple, Yanaka Cemetery)",
      "alternatives": [
        "Togoshi Ginza Shotengai (Tokyo's longest shopping street, very local)",
        "Sugamo Jizo-dori Shotengai (known as 'Harajuku for Grandmas')"
      ],
      "bestTime": "Late morning for the liveliest street atmosphere; early afternoon for softer light in the cemetery/temples.",
      "description": "A nostalgic, retro shopping street known for its local charm, friendly shopkeepers, and numerous cats. Adjacent, the tranquil Yanaka Cemetery and various temples (like Tennoji Temple) offer serene, green backdrops with traditional architecture. Great for lively candid street shots and peaceful, reflective moments.",
      "lightingNotes": "Open sky on the street can be bright. Cemetery/temples offer dappled light under trees and interesting shadows from architecture. Golden hour light can be beautiful filtering through trees.",
      "name": "Yanaka Ginza & Tennoji Temple Area",
      "permits": "No permits needed for photography on the public street or in the cemetery/temple grounds (be respectful of worshipers)."
    },
    {
      "accessibility": "Garden paths are mostly flat, but some stepping stones (isowatari) may be tricky for elaborate attire. MOT area is fully accessible.",
      "address": "3-9-10 Hirano, Koto, Tokyo (Kiyosumi Gardens, Museum of Contemporary Art Tokyo)",
      "alternatives": [
        "Shinjuku Gyoen National Garden (larger, more diverse landscapes but more popular)",
        "Hama-rikyu Gardens (beautiful waterside garden, but sometimes busier)"
      ],
      "bestTime": "Morning (for fewer crowds in the garden) or late afternoon (for softer light over the pond).",
      "description": "Kiyosumi Gardens is a classic Edo-period strolling garden with large ponds, stepping stones, and beautiful traditional landscaping, offering a serene and elegant backdrop. Nearby, the Museum of Contemporary Art Tokyo (MOT) provides a contrasting modern, minimalist architectural aesthetic for clean, contemporary shots.",
      "lightingNotes": "Gardens have open sky and reflective water, offering varied light. MOT exterior has clean lines and ample space for even lighting. Overcast days work well in the garden.",
      "name": "Kiyosumi Gardens & MOT Surroundings",
      "permits": "Kiyosumi Gardens has a small entrance fee (typically no photo permit needed for personal use). MOT exterior is public space."
    },
    {
      "accessibility": "Paths can be uneven, and there are some stairs. Not ideal for elaborate gowns or those with mobility issues. Flat shoes recommended.",
      "address": "1-22 Todoroki, Setagaya, Tokyo",
      "alternatives": [
        "Komazawa Olympic Park (large urban park with diverse scenery but less 'hidden gem')",
        "Rinshi-no-mori Park (forest-like park, also less dramatic)"
      ],
      "bestTime": "Morning for tranquil light and fewer visitors; late afternoon for soft, diffused light filtering through the canopy.",
      "description": "Tokyo's only natural gorge, offering a surprising escape into lush greenery, a serene stream, small waterfall, and a charming red bridge. It feels like a completely different world from the urban bustle, perfect for natural, intimate, and joyful moments amidst nature.",
      "lightingNotes": "Heavily shaded by trees, leading to soft, diffused light, which is excellent for flattering portraits. Can be dim on very overcast days.",
      "name": "Todoroki Valley",
      "permits": "Public park, no permits generally needed for casual photography."
    },
    {
      "accessibility": "Mostly flat, walkable streets and covered arcades. Very accessible.",
      "address": "Koenji, Suginami, Tokyo (around Koenji Station, particularly Pal and Look shopping arcades)",
      "alternatives": [
        "Shimokitazawa (similar indie/vintage vibe, but often more crowded)",
        "Nakano Broadway (unique shopping complex with a strong subculture vibe, but very interior)"
      ],
      "bestTime": "Late morning to early afternoon for bustling activity, or early evening for a lively, illuminated ambiance (especially in Pal arcade).",
      "description": "A vibrant, bohemian neighborhood known for its vintage shops, indie music scene, and unique local character. The covered Pal arcade offers a retro, lively vibe, while Look Street provides a more relaxed, quirky atmosphere with cafes and small businesses. Great for joyful, quirky, and genuinely candid interactions.",
      "lightingNotes": "Pal arcade is covered but well-lit by fluorescent and shop lights, creating a unique urban glow. Look Street is open-air, offering natural light.",
      "name": "Koenji Pal & Look Street",
      "permits": "Public streets and shopping arcades; no permits required for general photography. Be mindful of shop owners and don't block entrances."
    }
  ],
  "shots": [
    {
      "shotNumber": 1,
      "locationIndex": 0,
      "location": "Kagurazaka Alleys and Streets",
      "idealLighting": "Morning (for fewer crowds) or late afternoon/golden hour (for beautiful light)",
      "title": "Joyful Stroll in Kagurazaka Alley",
      "imagePrompt": "Kagurazaka, narrow alley, couple walking, laughter, traditional houses, stone path, warm light",
      "composition": "Medium shot, couple in motion walking hand-in-hand down a stone-paved alley. Utilize leading lines of the alley and traditional wooden houses framing them on both sides. Capture their genuine laughter and interaction.",
      "direction": "Encourage the couple to walk naturally, chatting and laughing. Be ready to capture spontaneous moments of connection. Let them lead the direction of their stroll.",
      "technical": "Aperture priority, f/2.8-4 to balance subject sharpness with environmental context. ISO auto, fast shutter speed (1/250s+) to freeze motion. Use a 35mm or 50mm prime lens. Shoot during golden hour for warm, soft light filtering into the alley.",
      "equipment": ["Mirrorless camera body", "35mm prime lens"],
      "poses": "Couple walking, holding hands, looking at each other, laughing naturally.",
      "blocking": "Couple walking away from or towards the camera down the alley. Photographer moves ahead or behind to capture their dynamic.",
      "communicationCues": "Encourage genuine interaction and movement. Let them lead, capture spontaneous moments.",
      "storyboardImage": "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0fgqhp4emv828j12jxrhhrg-shot-1-2025-07-18T19-40-03-235Z.jpg"
    },
    {
      "shotNumber": 2,
      "locationIndex": 0,
      "location": "Kagurazaka Alleys and Streets",
      "idealLighting": "Morning (for fewer crowds) or late afternoon/golden hour (for beautiful light)",
      "title": "Quiet Glance at Kagurazaka Shrine",
      "imagePrompt": "Kagurazaka, hidden shrine, couple intimate, soft light, traditional details, serene moment",
      "composition": "Close-up to medium shot of the couple peeking into a small, hidden shrine or by its entrance. Focus on their expressions and intimate connection, with the shrine's traditional details in the softly blurred background.",
      "direction": "Guide the couple to a small, quiet shrine. Ask them to quietly observe it together, allowing for a reflective, intimate moment. Be patient for authentic interaction.",
      "technical": "Aperture priority, f/1.8-2.5 for shallow depth of field, emphasizing the couple. ISO auto. Use an 85mm or 50mm prime lens for flattering compression. Utilize soft, diffused light from shade or early morning.",
      "equipment": ["Mirrorless camera body", "85mm prime lens"],
      "poses": "Couple standing close, looking into the shrine, perhaps one arm around the other, shared gaze.",
      "blocking": "Couple positioned slightly off-center or framed by the shrine's entrance. Photographer remains unobtrusive.",
      "communicationCues": "Wait for a natural pause, capture a quiet, connected moment as they observe the shrine.",
      "storyboardImage": "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0fgqhp4emv828j12jxrhhrg-shot-2-2025-07-18T19-40-04-633Z.jpg"
    },
    {
      "shotNumber": 3,
      "locationIndex": 1,
      "location": "Yanaka Ginza & Tennoji Temple Area",
      "idealLighting": "Late morning for the liveliest street atmosphere",
      "title": "Yanaka Ginza Street Market Merriment",
      "imagePrompt": "Yanaka Ginza, couple laughing, street market, local interaction, retro charm, candid street photography",
      "composition": "Wide-angle to medium shot, capturing the couple amidst the bustling Yanaka Ginza street. Frame them interacting with a friendly shopkeeper, observing a cat, or simply laughing while soaking in the lively atmosphere. Use the vibrant shop signs and street elements to add context.",
      "direction": "Encourage the couple to explore the shops and engage with their surroundings. Blend into the street, observe, and anticipate genuine, candid moments of joy and interaction.",
      "technical": "Shutter priority (1/250s or faster) to freeze motion of the street. Aperture f/4-5.6 for good depth of field to capture the street context. ISO auto. Use a versatile 24-70mm zoom lens. Shoot in late morning for the liveliest street activity.",
      "equipment": ["Mirrorless camera body", "24-70mm zoom lens"],
      "poses": "Couple interacting with environment, laughing, pointing, engaging with locals/cats, candid walking.",
      "blocking": "Couple moving through the street, photographer anticipates their movement and positions to capture interactions.",
      "communicationCues": "Blend in, observe, and anticipate. Capture them genuinely interacting with their surroundings or each other amidst the bustle.",
      "storyboardImage": "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0fgqhp4emv828j12jxrhhrg-shot-3-2025-07-18T19-40-02-998Z.jpg"
    },
    {
      "shotNumber": 4,
      "locationIndex": 1,
      "location": "Yanaka Ginza & Tennoji Temple Area",
      "idealLighting": "Early afternoon for softer light in the temple",
      "title": "Tranquil Moments at Tennoji Temple",
      "imagePrompt": "Tennoji Temple, couple walking, serene, dappled light, traditional temple, lush greenery, reflective",
      "composition": "Medium to wide shot of the couple walking slowly through the tranquil Tennoji Temple grounds. Frame them with traditional temple architecture and lush greenery, utilizing dappled light filtering through trees to create interesting patterns. Focus on their peaceful connection.",
      "direction": "Guide the couple to walk slowly and deliberately, encouraging quiet conversation and a sense of reflection. Point out interesting architectural details or serene spots. Look for natural frames within the temple grounds.",
      "technical": "Aperture priority, f/2.8-4 for a pleasing balance of subject sharpness and environmental context. ISO auto. Use a 50mm or 85mm prime lens. Shoot in early afternoon for softer light in the cemetery/temples, capitalizing on dappled light.",
      "equipment": ["Mirrorless camera body", "50mm prime lens"],
      "poses": "Couple walking, holding hands, arm-in-arm, quietly conversing or observing.",
      "blocking": "Couple walking away from or towards the camera on a path, framed by temple structures or trees.",
      "communicationCues": "Guide them to walk slowly, encouraging quiet connection. Utilize natural frames from temple elements."
    },
    {
      "shotNumber": 5,
      "locationIndex": 2,
      "location": "Kiyosumi Gardens & MOT Surroundings",
      "idealLighting": "Morning (for fewer crowds in the garden) or late afternoon (for softer light over the pond)",
      "title": "Graceful Stroll in Kiyosumi Gardens",
      "imagePrompt": "Kiyosumi Gardens, couple, stepping stones, pond reflection, elegant, serene, traditional landscape",
      "composition": "Wide shot, capturing the couple gracefully navigating the stepping stones across the large pond in Kiyosumi Gardens. Aim for a low angle to capture reflections in the water. Emphasize the elegant, traditional Japanese landscape as the backdrop.",
      "direction": "Ask the couple to walk slowly and deliberately across the stepping stones, perhaps pausing briefly on one. Guide their movements to ensure good composition with the pond and garden elements. Look for beautiful reflections.",
      "technical": "Aperture priority, f/4-5.6 for sufficient depth of field to capture the landscape and reflections. Use a CPL filter to enhance reflections and color saturation. Use a 24-70mm zoom lens to adjust framing. Shoot in the morning for fewer crowds and soft light over the pond.",
      "equipment": ["Mirrorless camera body", "24-70mm zoom lens", "Circular Polarizer (CPL) filter"],
      "poses": "Couple walking across stepping stones, holding hands, looking at reflection, graceful movement.",
      "blocking": "Couple walking across stones in mid-distance. Photographer positioned to capture reflections and the garden's breadth.",
      "communicationCues": "Ask them to walk slowly and deliberately, pausing slightly on a stone. Look for reflections."
    },
    {
      "shotNumber": 6,
      "locationIndex": 2,
      "location": "Kiyosumi Gardens & MOT Surroundings",
      "idealLighting": "Overcast days work well for even lighting",
      "title": "Modern Romance at MOT Tokyo",
      "imagePrompt": "MOT Tokyo, couple, minimalist architecture, clean lines, contemporary, artistic, connection",
      "composition": "Wide to medium shot, featuring the couple interacting with the minimalist, clean architectural lines of the Museum of Contemporary Art Tokyo (MOT) exterior. Use strong geometric shapes and negative space to create a contemporary, artistic feel. Focus on their modern connection against this backdrop.",
      "direction": "Position the couple to interact with the building's lines – perhaps walking in parallel, leaning against a clean wall, or standing in front of a striking architectural feature. Guide them for a sleek, contemporary aesthetic.",
      "technical": "Aperture priority, f/5.6-8 for sharp details across the architectural elements. Low ISO for clean, crisp images. Use a 35mm or 50mm prime lens. Overcast days provide excellent, even lighting for minimalist architecture, otherwise look for soft, diffused light.",
      "equipment": ["Mirrorless camera body", "35mm prime lens"],
      "poses": "Couple standing, walking, leaning against a wall, interacting subtly with the modern environment, looking at each other or camera.",
      "blocking": "Couple positioned symmetrically or asymmetrically against the stark architectural background. Photographer uses clean lines for framing.",
      "communicationCues": "Position them to interact with the architecture, perhaps leaning against a wall or walking in sync. Focus on sleekness."
    },
    {
      "shotNumber": 7,
      "locationIndex": 3,
      "location": "Todoroki Valley",
      "idealLighting": "Morning for tranquil light and fewer visitors; late afternoon for soft, diffused light filtering through the canopy",
      "title": "Red Bridge Romance in Todoroki Valley",
      "imagePrompt": "Todoroki Valley, red bridge, couple, lush greenery, intimate, natural, tranquil",
      "composition": "Medium shot of the couple on the charming red bridge in Todoroki Valley. Frame them intimately amidst the dense, lush greenery surrounding the bridge. Emphasize the contrast of the red bridge against the natural backdrop and their quiet connection.",
      "direction": "Suggest the couple pause mid-bridge, perhaps holding hands or sharing a gentle embrace, as if taking in the serene view. Capture their natural, intimate interaction in this unique setting.",
      "technical": "Aperture priority, f/2.8-4 for soft background blur while keeping the couple sharp. ISO auto. Use a 50mm or 85mm prime lens to compress the lush background. Shoot in morning or late afternoon for soft, diffused light filtering through the canopy.",
      "equipment": ["Mirrorless camera body", "50mm prime lens"],
      "poses": "Couple holding hands on bridge, gentle embrace, looking at each other, or looking out at the valley.",
      "blocking": "Couple positioned on the red bridge, photographer captures them from slightly off-center or from a classic head-on perspective.",
      "communicationCues": "Suggest they pause on the bridge, look at each other, or simply take in the view. Capture their natural interaction."
    },
    {
      "shotNumber": 8,
      "locationIndex": 3,
      "location": "Todoroki Valley",
      "idealLighting": "Morning for tranquil light and fewer visitors; late afternoon for soft, diffused light filtering through the canopy",
      "title": "Secluded Serenity by Todoroki Stream",
      "imagePrompt": "Todoroki Valley, couple, stream, small waterfall, lush canopy, serene, natural light",
      "composition": "Wide to medium shot, capturing the couple by the serene stream, with a glimpse of the small waterfall in the background. Frame them under the lush canopy, emphasizing the soft, diffused light. Focus on their connection amidst this natural escape.",
      "direction": "Encourage the couple to find a comfortable spot by the stream, perhaps sitting on a rock or simply enjoying the tranquil sound of the water. Look for pockets of beautiful, diffused light filtering through the leaves.",
      "technical": "Aperture priority, f/2.8-4 for gentle background separation. ISO auto, may need to be higher due to deep shade. Use a 35mm or 50mm prime lens. Utilize the soft, diffused light, potentially using a collapsible reflector for subtle fill light on faces if needed.",
      "equipment": ["Mirrorless camera body", "35mm prime lens", "collapsible reflector"],
      "poses": "Couple seated by stream, holding hands, looking at water, or standing close together enjoying the nature.",
      "blocking": "Couple positioned near the stream, potentially with the waterfall visible in the background. Photographer works with the natural light and environment.",
      "communicationCues": "Encourage them to find a comfortable spot, perhaps dipping toes in the stream, or simply enjoying the quiet. Look for pockets of light."
    },
    {
      "shotNumber": 9,
      "locationIndex": 4,
      "location": "Koenji Pal & Look Street",
      "idealLighting": "Early evening for a lively, illuminated ambiance (especially in Pal arcade)",
      "title": "Lively Stroll in Koenji Pal Arcade",
      "imagePrompt": "Koenji Pal, couple walking, arcade, vintage shops, vibrant, urban glow, candid",
      "composition": "Wide to medium shot, capturing the couple walking through the covered Pal arcade. Use the depth of the arcade and the vibrant, eclectic storefronts as the backdrop. Focus on their energetic interaction and the lively urban glow created by the shop lights.",
      "direction": "Encourage the couple to genuinely explore the arcade, pointing out interesting vintage items or shops. Capture their spontaneous reactions, laughter, and genuine enjoyment of the bohemian atmosphere.",
      "technical": "Shutter priority (1/160s or faster) to capture movement without too much blur. Aperture f/2.8-4 to manage the varied lighting. High ISO may be needed due to artificial lighting. Use a 24-70mm zoom lens. Shoot in early evening for the best illuminated ambiance.",
      "equipment": ["Mirrorless camera body", "24-70mm zoom lens"],
      "poses": "Couple walking, looking into shops, gesturing, laughing, interacting with the bustling environment.",
      "blocking": "Couple walking along the arcade, photographer moves to capture leading lines and vibrant shop fronts.",
      "communicationCues": "Let them explore, encourage pointing out interesting things, capture the spontaneous joy of discovery. Use the urban lights."
    },
    {
      "shotNumber": 10,
      "locationIndex": 4,
      "location": "Koenji Pal & Look Street",
      "idealLighting": "Late morning to early afternoon for bustling activity",
      "title": "Quirky Cafe Connection on Koenji Look Street",
      "imagePrompt": "Koenji Look Street, couple, cafe, vintage, quirky, candid interaction, warm light",
      "composition": "Close-up to medium shot of the couple enjoying a moment at a quirky cafe on Look Street, or browsing a vintage store. Focus on their genuine interaction, expressions, and the unique details of the surroundings. Use shallow depth of field to isolate them.",
      "direction": "Suggest they grab a coffee, browse a unique shop, or simply relax at a vintage spot. Be discreet and observant, capturing their unposed, authentic connection amidst the quirky charm of the street.",
      "technical": "Aperture priority, f/1.8-2.5 for beautiful bokeh, isolating the subjects. ISO auto. Use a 50mm or 85mm prime lens for flattering portraits and low light performance. Utilize natural light from storefronts or early afternoon light.",
      "equipment": ["Mirrorless camera body", "50mm prime lens"],
      "poses": "Couple seated at cafe, holding coffee cups, looking at each other, laughing, browsing vintage items, candid gestures.",
      "blocking": "Couple seated or standing within a cafe or shop. Photographer positions unobtrusively to capture candid moments.",
      "communicationCues": "Suggest they grab a coffee or browse. Be discreet, capture a genuine, unposed moment of connection."
    }
  ]
}


/**
 * Represents a photo shoot session with its complete lifecycle state.
 * Sessions are persisted in localStorage and can be in various states
 * from initial creation through conversation, processing, and completion.
 */
interface Session {
  /** Unique identifier for the session, generated with timestamp and random string */
  id: string;
  /** Current state of the session in its lifecycle */
  status: 'initial' | 'conversation' | 'processing' | 'complete';
  /** ID linking to the conversation thread in the messaging system */
  conversationId?: string;
  /** Context information about the photo shoot (theme, style, etc.) */
  context?: EdgePhotoShootContext;
  /** Array of location suggestions generated for the shoot */
  locations?: EdgeLocation[];
  /** Array of specific shot suggestions for the shoot */
  shots?: EdgeShot[];
  /** ISO timestamp of when the session was created */
  createdAt: string;
  /** Human-readable title for the session, defaults to date-based title */
  title?: string;
}

/**
 * Context type providing session management functionality.
 * Exposes methods for CRUD operations on sessions and access to current session.
 */
interface SessionContextType {
  /** All sessions stored in the system, keyed by session ID */
  sessions: Record<string, Session>;
  /** The currently active session based on URL pathname, null if none */
  currentSession: Session | null;
  /** Retrieves a specific session by ID */
  getSession: (id: string) => Session | null;
  /** Updates an existing session with partial data */
  updateSession: (id: string, updates: Partial<Session>) => void;
  /** Creates a new session and returns its ID */
  createNewSession: () => string;
  /** Permanently removes a session from storage */
  deleteSession: (id: string) => void;
}

/**
 * React Context for managing photo shoot sessions across the application.
 * Provides default implementations that return empty/null values.
 */
const SessionContext = createContext<SessionContextType>({
  sessions: {},
  currentSession: null,
  getSession: () => null,
  updateSession: () => {},
  createNewSession: () => '',
  deleteSession: () => {}
});

/**
 * Provider component that manages photo shoot session state and persistence.
 * 
 * This provider:
 * - Maintains all sessions in memory and syncs with localStorage
 * - Automatically detects the current session from URL pathname
 * - Provides CRUD operations for session management
 * - Handles session lifecycle from creation to completion
 * 
 * @param children - React components that need access to session context
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  /** In-memory storage of all sessions, synced with localStorage */
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const pathname = usePathname();
  
  /**
   * Extract session ID from pathname using regex pattern.
   * Expects URLs in format: /session/{sessionId}/...
   * Returns null if no session ID found in path.
   */
  const currentSessionId = pathname?.match(/\/session\/([^\/]+)/)?.[1] || null;
  
  /**
   * Load sessions from localStorage on component mount.
   * This ensures session persistence across page refreshes and browser sessions.
   * Handles JSON parsing errors gracefully by logging and continuing with empty state.
   * Seeds the app with a default session if no sessions exist.
   */
  useEffect(() => {
    console.log('[DEBUG] Loading sessions from localStorage...');
    const saved = localStorage.getItem('photoSessions');
    console.log('[DEBUG] Raw localStorage value:', saved);
    
    let parsedSessions: Record<string, Session> = {};
    
    if (saved) {
      try {
        parsedSessions = JSON.parse(saved);
        console.log('[DEBUG] Parsed sessions from localStorage:', parsedSessions);
        console.log('[DEBUG] Number of sessions in localStorage:', Object.keys(parsedSessions).length);
        
        // Log details of each session
        Object.entries(parsedSessions).forEach(([id, session]) => {
          const s = session as Session;
          console.log(`[DEBUG] Session ${id} from localStorage:`, {
            status: s.status,
            hasContext: !!s.context,
            hasLocations: !!s.locations,
            locationCount: s.locations?.length || 0,
            hasShots: !!s.shots,
            shotCount: s.shots?.length || 0,
            createdAt: s.createdAt,
            title: s.title
          });
        });
      } catch (e) {
        console.error('[DEBUG] Failed to parse sessions from localStorage:', e);
        console.error('[DEBUG] Invalid localStorage content:', saved);
      }
    } else {
      console.log('[DEBUG] No sessions found in localStorage');
    }
    
    // Add default sessions if they don't exist
    if (!parsedSessions[VANCOUVER_DEFAULT_SESSION.id]) {
      console.log('[DEBUG] Adding Vancouver default session to seed the app');
      parsedSessions[VANCOUVER_DEFAULT_SESSION.id] = VANCOUVER_DEFAULT_SESSION;
    }
    
    if (!parsedSessions[TOKYO_DEFAULT_SESSION.id]) {
      console.log('[DEBUG] Adding Tokyo default session to seed the app');
      parsedSessions[TOKYO_DEFAULT_SESSION.id] = TOKYO_DEFAULT_SESSION;
    }
    
    setSessions(parsedSessions);
  }, []);

  /**
   * Sync sessions to localStorage whenever they change.
   * This provides automatic persistence for all session updates.
   * Only saves if there are sessions to prevent clearing localStorage unnecessarily.
   * 
   * LocalStorage sync strategy:
   * - Triggered on every session state change
   * - Saves complete session object as JSON
   * - Key: 'photoSessions'
   * - No debouncing (immediate persistence)
   * - Implements cleanup for old sessions to prevent quota issues
   */
  useEffect(() => {
    if (Object.keys(sessions).length > 0) {
      try {
        // Clean up old sessions if we have too many
        const sessionEntries = Object.entries(sessions);
        // Limit sessions to prevent localStorage quota overflow (typically 5-10MB limit)
        // Each session with full shot data can be 100KB+, so we keep only recent ones
        // This prevents "QuotaExceededError" and ensures smooth app performance
        const MAX_SESSIONS = 10; // Keep only the 10 most recent sessions
        
        if (sessionEntries.length > MAX_SESSIONS) {
          // Sort by creation date and keep only the most recent
          const sortedSessions = sessionEntries
            .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, MAX_SESSIONS);
          
          const trimmedSessions = Object.fromEntries(sortedSessions);
          setSessions(trimmedSessions);
          return; // Will trigger this effect again with trimmed sessions
        }
        
        // Try to save to localStorage
        console.log('[DEBUG] Saving sessions to localStorage:', sessions);
        console.log('[DEBUG] Number of sessions being saved:', Object.keys(sessions).length);
        localStorage.setItem('photoSessions', JSON.stringify(sessions));
        console.log('[DEBUG] Sessions successfully saved to localStorage');
      } catch (e) {
        console.error('Failed to save sessions to localStorage:', e);
        
        // If quota exceeded, try to clear old data and retry
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.log('LocalStorage quota exceeded, clearing old sessions...');
          
          // Keep only the current session and the 5 most recent
          const currentSession = sessions[currentSessionId || ''];
          const otherSessions = Object.entries(sessions)
            .filter(([id]) => id !== currentSessionId)
            .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);
          
          const minimalSessions = {
            ...(currentSession ? { [currentSessionId!]: currentSession } : {}),
            ...Object.fromEntries(otherSessions)
          };
          
          try {
            localStorage.setItem('photoSessions', JSON.stringify(minimalSessions));
            setSessions(minimalSessions);
          } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
            // As a last resort, clear localStorage and save only current session
            localStorage.removeItem('photoSessions');
            if (currentSession && currentSessionId) {
              const currentOnly = { [currentSessionId]: currentSession };
              localStorage.setItem('photoSessions', JSON.stringify(currentOnly));
              setSessions(currentOnly);
            }
          }
        }
      }
    }
  }, [sessions, currentSessionId]);

  /**
   * Save session to Supabase database
   * Falls back gracefully if Supabase is not available or fails
   */
  const saveToSupabase = async (session: Session) => {
    if (!supabase) {
      console.log('Supabase client not available, skipping database save');
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .upsert({
          id: session.id,
          status: session.status,
          conversation_id: session.conversationId,
          context: session.context,
          locations: session.locations,
          shots: session.shots,
          created_at: session.createdAt,
          title: session.title
        });

      if (error) {
        console.error('Error saving session to Supabase:', error);
      } else {
        console.log('Session saved to Supabase:', session.id);
      }
    } catch (error) {
      console.error('Failed to save session to Supabase:', error);
    }
  };

  /**
   * Creates a new photo shoot session with initial state.
   * 
   * Session ID generation:
   * - Timestamp prefix ensures uniqueness and provides creation order
   * - Random suffix (base36) prevents collisions for rapid creation
   * - Format: session-{timestamp}-{randomString}
   * 
   * @returns {string} The ID of the newly created session
   */
  const createNewSession = () => {
    const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newSession: Session = {
      id,
      status: 'initial',
      createdAt: new Date().toISOString(),
      title: `Session ${new Date().toLocaleDateString()}`
    };
    
    // Save to localStorage immediately for responsive UI
    setSessions(prev => ({ ...prev, [id]: newSession }));
    
    // Save to Supabase for persistence (async, non-blocking)

    console.log('saving to supabase', newSession)
    saveToSupabase(newSession);
    
    return id;
  };

  /**
   * Updates an existing session with partial data.
   * Performs shallow merge of updates into existing session.
   * 
   * Status transitions typically follow:
   * - initial → conversation (when user starts planning)
   * - conversation → processing (when AI generates suggestions)
   * - processing → complete (when suggestions are ready)
   * 
   * @param id - The session ID to update
   * @param updates - Partial session object with fields to update
   */
  const updateSession = (id: string, updates: Partial<Session>) => {
    console.log(`[DEBUG] updateSession called for ${id} with updates:`, updates);
    
    setSessions(prev => {
      if (!prev[id]) {
        console.error(`[DEBUG] Session ${id} not found in current sessions`);
        return prev;
      }
      
      console.log(`[DEBUG] Current session ${id} before update:`, prev[id]);
      
      // Create the updated session object
      const updatedSession = { ...prev[id], ...updates };
      
      console.log(`[DEBUG] Updated session ${id} after merge:`, updatedSession);
      
      // Save to Supabase for persistence (async, non-blocking)
      console.log('updating session in supabase', updatedSession);
      saveToSupabase(updatedSession);
      
      return {
        ...prev,
        [id]: updatedSession
      };
    });
  };

  /**
   * Permanently removes a session from storage.
   * Deletion is immediate and cannot be undone.
   * Automatically triggers localStorage sync via useEffect.
   * 
   * @param id - The session ID to delete
   */
  const deleteSession = (id: string) => {
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[id];
      return newSessions;
    });
  };

  /**
   * Retrieves a specific session by ID.
   * Returns null if session doesn't exist.
   * 
   * @param id - The session ID to retrieve
   * @returns The session object or null if not found
   */
  const getSession = (id: string) => sessions[id] || null;
  
  /**
   * Derives the current session from URL pathname.
   * Automatically updates when navigation occurs.
   * Returns null if no session ID in URL or session doesn't exist.
   */
  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

  /**
   * Context provider implementation following React Context pattern.
   * Provides session state and management functions to all child components.
   * 
   * The provider exposes:
   * - sessions: Complete session storage for listing/browsing
   * - currentSession: URL-derived active session for convenience
   * - CRUD operations: create, read, update, delete sessions
   * 
   * All operations automatically sync to localStorage for persistence.
   */
  return (
    <SessionContext.Provider value={{ 
      sessions, 
      currentSession, 
      getSession,
      updateSession, 
      createNewSession,
      deleteSession 
    }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Custom hook for accessing session context.
 * Must be used within a SessionProvider component tree.
 * 
 * @returns {SessionContextType} Session context with state and methods
 * @throws {Error} If used outside of SessionProvider
 */
export const useSession = () => useContext(SessionContext);