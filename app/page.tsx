'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from './providers/SessionProvider';
import { SessionCard } from './components/SessionCard';
import { useMemo } from 'react';

export default function Home() {
  const router = useRouter();
  const { createNewSession, sessions } = useSession();

  // Get completed sessions sorted by date
  const completedSessions = useMemo(() => {
    return Object.values(sessions)
      .filter(session => session.status === 'complete' && session.locations && session.locations.length > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sessions]);

  const handleCreateSession = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Header - Mobile app style */}
      <header className="bg-white">
        <div className="px-4 py-4">
          <h1 className="text-[28px] font-semibold text-[#343434]">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-4">
        <button
          onClick={handleCreateSession}
          className="w-full bg-black/[0.08] rounded py-[13px] px-8 flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 5V17M5 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-[17px] font-semibold">New Session</span>
        </button>
      </div>

      {/* Dev Tools (remove for production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-28 right-4 bg-gray-100 p-2 rounded shadow z-10">
          <Link 
            href="/test-imagen" 
            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Test Page
          </Link>
        </div>
      )}
    </div>
  );
}

