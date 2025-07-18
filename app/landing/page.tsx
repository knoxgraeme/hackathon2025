'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();


  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="PixieDirector Logo"
              width={32}
              height={32}
              className="rounded-sm"
            />
            <h1 className="text-xl font-semibold text-gray-900">PixieDirector</h1>
          </div>
          <div></div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-32 text-center">
          <h2 className="text-5xl sm:text-7xl font-light text-gray-900 mb-6 tracking-tight">
            AI-Powered<br />Photography Storyboarding
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Transform your photoshoot planning with voice-powered AI. Get personalized locations, 
            shot lists, and storyboards in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gray-900 text-white rounded-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Start Planning
            </button>
            <a
              href="https://github.com/knoxgraeme/hackathon2025"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-sm font-medium hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </section>


      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Voice Conversations</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Natural dialogue with AI about your vision, locations, and creative goals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Location Scouting</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Curated shooting spots with timing, permits, and backup alternatives
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-medium mb-2">AI Storyboards</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Visual shot previews with composition guides and direction notes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="py-20 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-4">Multi-Agent AI Pipeline</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            A sophisticated orchestration of specialized AI agents working together to create your perfect photoshoot plan
          </p>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  01
                </div>
                <div>
                  <h3 className="font-medium mb-1">Voice Conversation Agent</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    ElevenLabs AI conducts a natural dialogue, asking smart follow-up questions about your vision.
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">30-60s conversation</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Natural language</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  02
                </div>
                <div>
                  <h3 className="font-medium mb-1">Context Extraction Agent</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Gemini 2.5 Flash analyzes the transcript and extracts 12 structured fields including location, mood, and equipment.
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">3-5s processing</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">JSON schema validation</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  03
                </div>
                <div>
                  <h3 className="font-medium mb-1">Location Scout Agent</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Specialized agent generates 4-5 Vancouver-specific locations with timing, permits, and accessibility notes.
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">5-8s generation</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Local knowledge</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  04
                </div>
                <div>
                  <h3 className="font-medium mb-1">Shot Planning Agent</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Creates 15-20 detailed shots with composition guides, posing directions, and technical settings.
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">8-10s planning</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Location-aware</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  05
                </div>
                <div>
                  <h3 className="font-medium mb-1">Storyboard Visualization Agent</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Google Imagen 3 generates up to 6 black & white storyboards in parallel, each matching the shot specifications.
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">15-20s parallel</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">3:4 aspect ratio</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Total Pipeline Time</h4>
                <span className="text-2xl font-light">30-45 seconds</span>
              </div>
              <div className="text-xs text-gray-500">
                From conversation end to complete photoshoot plan with visuals
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Technology Section */}
      <section className="py-20 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-16">Built With Modern Technology</h2>
          
          <div className="grid md:grid-cols-3 gap-x-12 gap-y-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 mb-4">Frontend</h3>
              <ul className="space-y-2 text-sm">
                <li>Next.js 15.4</li>
                <li>React 19</li>
                <li>TypeScript</li>
                <li>Tailwind CSS v4</li>
                <li>Progressive Web App</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 mb-4">AI Services</h3>
              <ul className="space-y-2 text-sm">
                <li>ElevenLabs Voice</li>
                <li>Google Gemini 2.5</li>
                <li>Google Imagen 3</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 mb-4">Backend & Storage</h3>
              <ul className="space-y-2 text-sm">
                <li>Supabase Edge Functions</li>
                <li>PostgreSQL Database</li>
                <li>Supabase Storage</li>
                <li>Vercel Hosting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-16">Perfect For Every Photographer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="font-medium mb-2">Portraits</h3>
              <p className="text-sm text-gray-600">Client sessions with varied locations and poses</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Weddings</h3>
              <p className="text-sm text-gray-600">Comprehensive shot lists for the perfect day</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Commercial</h3>
              <p className="text-sm text-gray-600">Organized storyboards for complex productions</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Students</h3>
              <p className="text-sm text-gray-600">Learn composition and planning techniques</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-light mb-8">Ready to Transform Your Photography Planning?</h2>
          <p className="text-lg mb-8 text-gray-300 font-light">
            Join photographers who are saving hours of planning time with AI assistance.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-white text-gray-900 rounded-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Start Your First Session
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white text-center border-t border-gray-800">
        <p className="text-sm text-gray-400">Built for Hackathon 2025</p>
      </footer>
    </div>
  );
}