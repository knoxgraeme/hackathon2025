'use client';

import { useRouter } from 'next/navigation';
import { useSession } from './providers/SessionProvider';

export default function Home() {
  const router = useRouter();
  const { createNewSession } = useSession();

  const handleCreateSession = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12">
        {/* Main heading */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-normal leading-tight text-gray-800 max-w-4xl mx-auto">
            Create your new photo session with{' '}
            <span className="font-semibold">PixieDirector</span>.
          </h1>
        </div>
      </div>

      {/* Bottom button area */}
      <div className="px-8 pb-8">
        <button
          onClick={handleCreateSession}
          className="w-full bg-gray-100 hover:bg-gray-200 text-black py-4 px-6 rounded-full flex items-center justify-center gap-3 font-medium text-lg transition-colors"
        >
          <span className="text-xl">+</span>
          New Session
        </button>
      </div>
    </div>
  );
}

