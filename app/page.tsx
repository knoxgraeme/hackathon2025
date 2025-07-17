'use client';

import { useRouter } from 'next/navigation';
import { useSession } from './providers/SessionProvider';
import { SessionCard } from './components/SessionCard';
import { useMemo } from 'react';

export default function Home() {
  const router = useRouter();
  const { createNewSession, sessions } = useSession();

  // Get completed sessions sorted by date
  const completedSessions = useMemo(() => {
    // Debug logging to understand session filtering
    console.log('[DEBUG] All sessions from provider:', sessions);
    console.log('[DEBUG] Number of sessions:', Object.keys(sessions).length);
    
    const allSessionsArray = Object.values(sessions);
    console.log('[DEBUG] Sessions as array:', allSessionsArray);
    
    const filtered = allSessionsArray
      .filter(session => {
        const isComplete = session.status === 'complete';
        const hasLocations = session.locations && session.locations.length > 0;
        
        console.log(`[DEBUG] Session ${session.id}:`, {
          status: session.status,
          isComplete,
          locations: session.locations,
          hasLocations,
          passesFilter: isComplete && hasLocations
        });
        
        return isComplete && hasLocations;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log('[DEBUG] Filtered completed sessions:', filtered);
    console.log('[DEBUG] Number of completed sessions:', filtered.length);
    
    return filtered;
  }, [sessions]);

  const handleCreateSession = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Header - Mobile app style */}
      <header className="bg-white">
        <div className="px-4 pt-12 pb-4">
          <h1 className="text-[33px] font-semibold leading-[36px] text-[#343434]">
            Your Sessions
          </h1>
        </div>
      </header>

      {/* Main Content */}
      {completedSessions.length === 0 ? (
        // Empty State
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
          <div className="max-w-[290px] text-center">
            <h2 className="text-[33px] leading-[36px] text-[#343434] font-normal">
              Create your new photo session with <span className="font-semibold">PixieDirector</span>.
            </h2>
          </div>
        </div>
      ) : (
        // Sessions List - with padding bottom for fixed button
        <div className="flex-1 px-4 py-6 overflow-y-auto pb-24">
          <div className="max-w-md mx-auto">
            {completedSessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* Fixed Bottom CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 pb-8 pt-4">
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
  );
}

