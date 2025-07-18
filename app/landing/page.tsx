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
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">PixieDirector</h1>
          <div className="flex gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Try Demo
            </button>
            <a
              href="https://github.com/graemeknox/hackathon2025"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-32 text-center">
          <h2 className="text-5xl sm:text-7xl font-light text-gray-900 mb-6 tracking-tight">
            AI-Powered<br />Photography Planning
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Transform your photoshoot planning with voice-powered AI. Get personalized locations, 
            shot lists, and storyboards in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gray-900 text-white rounded-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Start Planning
            </button>
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-sm font-medium hover:border-gray-400 transition-colors"
              >
                Install App
              </button>
            )}
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
          <h2 className="text-3xl font-light text-center mb-16">How It Works</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  01
                </div>
                <div>
                  <h3 className="font-medium mb-1">Start a Voice Conversation</h3>
                  <p className="text-gray-600 text-sm">
                    Talk naturally about your photoshoot vision. Our AI asks clarifying questions about locations, mood, and subjects.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  02
                </div>
                <div>
                  <h3 className="font-medium mb-1">AI Processing & Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Gemini AI extracts context from your conversation and generates location-specific recommendations.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  03
                </div>
                <div>
                  <h3 className="font-medium mb-1">Receive Your Plan</h3>
                  <p className="text-gray-600 text-sm">
                    Get 4-5 shooting locations, detailed shot lists, and AI-generated storyboard visualizations.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  04
                </div>
                <div>
                  <h3 className="font-medium mb-1">Share & Execute</h3>
                  <p className="text-gray-600 text-sm">
                    Share plans with clients via QR codes, track shot completion, and reference on-location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
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
              <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 mb-4">Infrastructure</h3>
              <ul className="space-y-2 text-sm">
                <li>Supabase Edge Functions</li>
                <li>Deno Runtime</li>
                <li>Cloud Storage</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* QR Codes Section */}
      <section className="py-20 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-16">Access Anywhere</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-2xl mx-auto">
            <div className="text-center">
              <h3 className="font-medium mb-6">Source Code</h3>
              <div className="bg-white p-8 rounded-sm shadow-sm inline-block">
                {qrCodeUrls.github && (
                  <Image 
                    src={qrCodeUrls.github} 
                    alt="QR Code for GitHub repository" 
                    width={180}
                    height={180}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-4">View on GitHub</p>
            </div>
            <div className="text-center">
              <h3 className="font-medium mb-6">Mobile App</h3>
              <div className="bg-white p-8 rounded-sm shadow-sm inline-block">
                {qrCodeUrls.pwa && (
                  <Image 
                    src={qrCodeUrls.pwa} 
                    alt="QR Code to install PWA" 
                    width={180}
                    height={180}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-4">Install Progressive Web App</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
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