'use client';

import { useRouter } from 'next/navigation';
import { useSession } from './providers/SessionProvider';
import { SessionCard } from './components/SessionCard';
import { SplashScreen } from './components/SplashScreen';
import { useMemo, useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { createNewSession, sessions } = useSession();
  const [showSplash, setShowSplash] = useState(true);

  // Check if this is the first time visiting the app
  useEffect(() => {
    const hasVisited = localStorage.getItem('pixie-director-visited');
    if (hasVisited) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    localStorage.setItem('pixie-director-visited', 'true');
    setShowSplash(false);
  };

  // Get all sessions that are not just empty initial states, sorted by date
  const sessionsWithProgress = useMemo(() => {
    // Debug logging to understand session filtering
    console.log('[DEBUG] All sessions from provider:', sessions);
    console.log('[DEBUG] Number of sessions:', Object.keys(sessions).length);

    const allSessionsArray = Object.values(sessions);
    console.log('[DEBUG] Sessions as array:', allSessionsArray);

    const filtered = allSessionsArray
      .filter(session => {
        // Show sessions that have meaningful progress:
        const hasProgress = session.status !== 'initial' || session.conversationId || session.context || session.locations;

        console.log(`[DEBUG] Session ${session.id}:`, {
          status: session.status,
          hasConversationId: !!session.conversationId,
          hasContext: !!session.context,
          hasLocations: !!(session.locations && session.locations.length > 0),
          hasProgress,
          passesFilter: hasProgress
        });

        return hasProgress;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('[DEBUG] Filtered sessions with progress:', filtered);
    console.log('[DEBUG] Number of sessions with progress:', filtered.length);

    return filtered;
  }, [sessions]);

  const handleCreateSession = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <div className="min-h-screen bg-white flex flex-col relative" style={{ 
        overscrollBehavior: 'none',
        touchAction: 'pan-x pan-y',
        WebkitOverflowScrolling: 'touch'
      }}>
      {/* Header - Mobile app style - Only show when sessions exist */}
      {sessionsWithProgress.length > 0 && (
        <header className="bg-white">
          <div className="px-4 pb-4" style={{ paddingTop: `max(48px, env(safe-area-inset-top) + 36px)` }}>
            <h1 className="text-[33px] font-semibold leading-[36px] text-[#343434]">
              Your Sessions
            </h1>
          </div>
        </header>
      )}

      {/* Main Content */}
      {sessionsWithProgress.length === 0 ? (
        // Empty State
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
          <div className="max-w-[290px] text-center">
            <h2 className="text-[33px] leading-[36px] text-[#343434] font-normal">
              Discuss your new photo session with <span className="font-semibold">PixieDirector</span>.
            </h2>
          </div>
        </div>
      ) : (
        // Sessions List - with padding bottom for fixed button
        <div className="flex-1 px-4 py-6 overflow-y-auto pb-24">
          <div className="max-w-md mx-auto">
            {sessionsWithProgress.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* Fixed Bottom CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 pt-4" style={{ paddingBottom: `max(32px, env(safe-area-inset-bottom))` }}>
        <button
          onClick={handleCreateSession}
          className="w-full bg-[#00a887] text-white flex items-center justify-center gap-3 px-8 py-[13px] rounded active:scale-95 transition-transform"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 5V17M5 11H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-[17px] font-semibold leading-[22px]">New Session</span>
        </button>
      </div>

    </div>
    </>
  );
}

