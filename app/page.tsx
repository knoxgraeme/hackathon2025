'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from './providers/SessionProvider';
import { Button } from './components/Button';
import { PullToRefresh } from './components/PullToRefresh';
import { FloatingActionButton } from './components/FloatingActionButton';

export default function Home() {
  const router = useRouter();
  const { sessions, createNewSession } = useSession();

  const handleRefresh = async () => {
    // In a real app, this would fetch fresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

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
      case 'initial': return 'bg-white/10';
      case 'conversation': return 'bg-yellow-500/20';
      case 'processing': return 'bg-blue-500/20';
      case 'complete': return 'bg-green-500/20';
      default: return 'bg-white/10';
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="min-h-screen text-white">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Photography Assistant
          </h1>
          <p className="text-xl text-secondary">
            Plan your perfect photoshoot with AI-powered location scouting and storyboarding
          </p>
        </div>

        {/* New Session Button */}
        <div className="mb-8 text-center animate-slide-up">
          <Button
            onClick={handleCreateSession}
            size="lg"
            icon={<span className="text-2xl">✨</span>}
          >
            Start New Photo Session
          </Button>
        </div>

        {/* Sessions List */}
        {sessionsList.length > 0 ? (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-primary">Your Sessions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessionsList.map((session, index) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="block animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="glass-card p-6 hover:scale-105 transition-all duration-300 hover:bg-white/15">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm backdrop-blur-md ${getStatusColor(session.status)}`}>
                        <span>{getStatusIcon(session.status)}</span>
                        <span className="capitalize">{session.status}</span>
                      </span>
                      <span className="text-sm text-tertiary">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Session Title */}
                    <h3 className="font-semibold text-lg mb-2 text-primary">
                      {session.title || 'Untitled Session'}
                    </h3>

                    {/* Session Details */}
                    {session.context && (
                      <div className="text-sm text-secondary space-y-1">
                        <p>📸 {session.context.shootType}</p>
                        <p>🎨 {session.context.mood?.join(', ')}</p>
                        <p>📍 {session.locations?.length || 0} locations</p>
                      </div>
                    )}

                    {session.status === 'initial' && (
                      <p className="text-sm text-tertiary italic mt-3">
                        Tap to start planning
                      </p>
                    )}

                    {session.status === 'processing' && (
                      <p className="text-sm text-yellow-400 italic mt-3">
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
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-semibold mb-2 text-primary">No sessions yet</h2>
                          <p className="text-secondary mb-8">
                Start your first photo planning session to get personalized location<br />
                recommendations and storyboard suggestions
              </p>
              <Button
                onClick={handleCreateSession}
              >
                Create Your First Session
              </Button>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-center">
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-3xl mb-3">🎤</div>
            <h3 className="font-semibold mb-2 text-primary">Voice Planning</h3>
            <p className="text-sm text-secondary">
              Describe your vision naturally through conversation
            </p>
          </div>
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-semibold mb-2 text-primary">Smart Locations</h3>
            <p className="text-sm text-secondary">
              Get curated Vancouver spots perfect for your shoot
            </p>
          </div>
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="font-semibold mb-2 text-primary">Storyboarding</h3>
            <p className="text-sm text-secondary">
              Visual shot plans with pose directions and tips
            </p>
          </div>
        </div>

        {/* Dev Tools (remove for production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-16 p-4 glass-card-dark rounded-lg">
            <h3 className="font-bold mb-3 text-primary">Dev Tools</h3>
            <div className="flex gap-2">
              <Link 
                href="/test-imagen" 
                className="text-sm px-3 py-1 glass-card hover:bg-white/20 rounded transition-all"
              >
                Test Page
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('photoSessions');
                  window.location.reload();
                }}
                className="text-sm px-3 py-1 bg-red-500/30 hover:bg-red-500/50 backdrop-blur-md rounded transition-all"
              >
                Clear All Sessions
              </button>
            </div>
          </div>
        )}
      </div>
      <FloatingActionButton />
    </main>
    </PullToRefresh>
  );
}

