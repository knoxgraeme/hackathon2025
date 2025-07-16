'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from './providers/SessionProvider';

export default function Home() {
  const router = useRouter();
  const { sessions, createNewSession } = useSession();

  const handleCreateSession = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  const sessionsList = Object.values(sessions).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'initial': return '📋';
      case 'conversation': return '🎤';
      case 'processing': return '⚙️';
      case 'complete': return '✅';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initial': return 'bg-gray-700';
      case 'conversation': return 'bg-yellow-700';
      case 'processing': return 'bg-blue-700';
      case 'complete': return 'bg-green-700';
      default: return 'bg-gray-700';
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            AI Photography Assistant
          </h1>
          <p className="text-xl text-gray-400">
            Plan your perfect photoshoot with AI-powered location scouting and storyboarding
          </p>
        </div>

        {/* New Session Button */}
        <div className="mb-8 text-center">
          <button
            onClick={handleCreateSession}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium text-lg shadow-lg transform transition hover:scale-105"
          >
            ✨ Start New Photo Session
          </button>
        </div>

        {/* Sessions List */}
        {sessionsList.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Sessions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessionsList.map((session) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="block"
                >
                  <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-gray-600">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(session.status)}`}>
                        <span>{getStatusIcon(session.status)}</span>
                        <span className="capitalize">{session.status}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Session Title */}
                    <h3 className="font-semibold text-lg mb-2">
                      {session.title || 'Untitled Session'}
                    </h3>

                    {/* Session Details */}
                    {session.context && (
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>📸 {session.context.shootType}</p>
                        <p>🎨 {session.context.mood?.join(', ')}</p>
                        <p>📍 {session.locations?.length || 0} locations</p>
                      </div>
                    )}

                    {session.status === 'initial' && (
                      <p className="text-sm text-gray-500 italic">
                        Tap to start planning
                      </p>
                    )}

                    {session.status === 'processing' && (
                      <p className="text-sm text-yellow-500 italic">
                        Processing your vision...
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-semibold mb-2">No sessions yet</h2>
            <p className="text-gray-400 mb-8">
              Start your first photo planning session to get personalized location<br />
              recommendations and storyboard suggestions
            </p>
            <button
              onClick={handleCreateSession}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Create Your First Session
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-center">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🎤</div>
            <h3 className="font-semibold mb-2">Voice Planning</h3>
            <p className="text-sm text-gray-400">
              Describe your vision naturally through conversation
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-semibold mb-2">Smart Locations</h3>
            <p className="text-sm text-gray-400">
              Get curated Vancouver spots perfect for your shoot
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="font-semibold mb-2">Storyboarding</h3>
            <p className="text-sm text-gray-400">
              Visual shot plans with pose directions and tips
            </p>
          </div>
        </div>

        {/* Dev Tools (remove for production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-16 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-bold mb-3">Dev Tools</h3>
            <div className="flex gap-2">
              <Link 
                href="/test-imagen" 
                className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Test Page
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('photoSessions');
                  window.location.reload();
                }}
                className="text-sm px-3 py-1 bg-red-700 hover:bg-red-600 rounded"
              >
                Clear All Sessions
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

