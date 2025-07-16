'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from './providers/SessionProvider';

export default function Home() {
  const router = useRouter();
  const { createNewSession } = useSession();

  const handleCreateSession = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-[290px] text-center">
          <h1 className="text-[33px] leading-[36px] text-[#343434] font-normal">
            Create your new photo session with <span className="font-semibold">PixieDirector</span>.
          </h1>
        </div>
      </div>

      {/* Bottom Section with Button */}
      <div className="px-4 pb-12">
        <button
          onClick={handleCreateSession}
          className="w-full bg-black/[0.08] rounded py-[13px] px-8 flex items-center justify-center gap-3"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 5V17M5 11H17" stroke="black" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-[17px] font-semibold text-black">New Session</span>
        </button>
      </div>

      {/* Dev Tools (remove for production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-20 right-4 bg-gray-100 p-2 rounded shadow">
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

