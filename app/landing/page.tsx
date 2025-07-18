'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [qrCodeUrls, setQrCodeUrls] = useState({ github: '', pwa: '' });
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Generate QR codes
    const githubUrl = 'https://github.com/graemeknox/hackathon2025';
    const pwaUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    setQrCodeUrls({
      github: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(githubUrl)}`,
      pwa: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pwaUrl)}`
    });

    // PWA install handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-purple-500/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-4">
              PixieDirector
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8">
              Plan your perfect photoshoot with voice-powered AI assistance
            </p>
            <p className="max-w-2xl mx-auto text-gray-700 mb-12">
              An innovative AI-powered mobile app that transforms how photographers plan their shoots. 
              Simply have a conversation with our AI assistant about your vision, and receive personalized 
              location recommendations, detailed shot lists, and AI-generated storyboards - all optimized 
              for Vancouver photographers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="px-8 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-colors"
                >
                  Install PWA
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Try Demo
              </button>
              <a
                href="https://github.com/graemeknox/hackathon2025"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* QR Codes Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Quick Access</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <h3 className="font-semibold mb-4">GitHub Repository</h3>
              {qrCodeUrls.github && (
                <Image 
                  src={qrCodeUrls.github} 
                  alt="QR Code for GitHub repository" 
                  width={200}
                  height={200}
                  className="mx-auto mb-4"
                />
              )}
              <p className="text-sm text-gray-600">Scan to view source code</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <h3 className="font-semibold mb-4">Install PWA</h3>
              {qrCodeUrls.pwa && (
                <Image 
                  src={qrCodeUrls.pwa} 
                  alt="QR Code to install PWA" 
                  width={200}
                  height={200}
                  className="mx-auto mb-4"
                />
              )}
              <p className="text-sm text-gray-600">Scan on mobile to install app</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          {/* AI Workflow */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-center">The AI-Powered Workflow</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                <div className="text-3xl mb-4">🎙️</div>
                <h4 className="font-semibold mb-2">Voice Input</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Natural conversation</li>
                  <li>• ElevenLabs voice AI</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                <div className="text-3xl mb-4">🤖</div>
                <h4 className="font-semibold mb-2">AI Processing</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Context extraction</li>
                  <li>• Gemini 2.5</li>
                  <li>• Structured output</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 text-center">
                <div className="text-3xl mb-4">📸</div>
                <h4 className="font-semibold mb-2">Visual Output</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Location scouting</li>
                  <li>• Shot lists</li>
                  <li>• Storyboards</li>
                  <li>• Imagen 3</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Supabase Pipeline */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-center">Supabase Edge Function Pipeline</h3>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold">Transcript Retrieval</h4>
                    <p className="text-sm text-gray-600">Fetch conversation from ElevenLabs API</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold">Context Extraction</h4>
                    <p className="text-sm text-gray-600">Parse 12 key fields using Gemini's structured output</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold">Location Generation</h4>
                    <p className="text-sm text-gray-600">Create 4-5 Vancouver-specific shooting locations</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold">Shot Planning</h4>
                    <p className="text-sm text-gray-600">Generate detailed shot lists with composition guidance</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">5</div>
                  <div>
                    <h4 className="font-semibold">Visual Storyboards</h4>
                    <p className="text-sm text-gray-600">Create black & white line-art previews with Imagen 3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Technology Stack</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4 text-teal-600">Frontend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">▸</span>
                  <span><strong>Next.js 15.4</strong> - App Router</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">▸</span>
                  <span><strong>React 19</strong> - Latest UI</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">▸</span>
                  <span><strong>TypeScript 5</strong> - Type-safe</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">▸</span>
                  <span><strong>Tailwind v4</strong> - Modern CSS</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">▸</span>
                  <span><strong>PWA</strong> - Installable</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4 text-purple-600">AI Services</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">▸</span>
                  <span><strong>ElevenLabs</strong> - Voice AI</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">▸</span>
                  <span><strong>Gemini 2.5</strong> - Understanding</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">▸</span>
                  <span><strong>Imagen 3</strong> - Storyboards</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4 text-blue-600">Backend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">▸</span>
                  <span><strong>Supabase</strong> - Edge Functions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">▸</span>
                  <span><strong>Deno</strong> - Runtime</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">▸</span>
                  <span><strong>Storage</strong> - Images</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="text-3xl">🎙️</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Voice-First Planning</h3>
                <p className="text-gray-700">Have natural conversations about your photoshoot vision. Our AI asks the right questions about locations, mood, subjects, and equipment.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">📍</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Smart Location Scouting</h3>
                <p className="text-gray-700">Get curated locations with exact addresses, best shooting times, permit requirements, and backup alternatives.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">📸</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Detailed Shot Lists</h3>
                <p className="text-gray-700">Professional shot planning including composition guides, subject posing directions, communication cues, and technical settings.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🎨</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">AI Storyboards</h3>
                <p className="text-gray-700">Visualize your shots before the shoot with black & white line-art previews and easy-to-share visual references.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Mobile-First PWA</h3>
                <p className="text-gray-700">Install as native app, share storyboards with clients, and track shot completion on the go.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Use Cases</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">👤</div>
              <h3 className="font-semibold mb-2">Portrait Photographers</h3>
              <p className="text-sm text-gray-600">Plan client sessions with location variety and pose ideas</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">💑</div>
              <h3 className="font-semibold mb-2">Wedding Photographers</h3>
              <p className="text-sm text-gray-600">Scout locations and create shot lists for the big day</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="font-semibold mb-2">Commercial Shoots</h3>
              <p className="text-sm text-gray-600">Organize complex productions with detailed storyboards</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">📚</div>
              <h3 className="font-semibold mb-2">Photography Students</h3>
              <p className="text-sm text-gray-600">Learn composition and planning techniques</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-teal-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Try It Now</h2>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">1️⃣</span>
              <p className="text-lg">Install the PWA on your mobile device</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">2️⃣</span>
              <p className="text-lg">Start a conversation about your next photoshoot</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">3️⃣</span>
              <p className="text-lg">Get personalized recommendations in under 60 seconds</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-white text-teal-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Planning Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white text-center">
        <p className="mb-2">Built with ❤️ for Hackathon 2025</p>
        <p className="text-sm text-gray-400">Empowering photographers with AI-powered planning tools</p>
      </footer>
    </div>
  );
}