// components/LoadingStates.tsx
export function LoadingPipeline() {
    const [stage, setStage] = useState(0);
    
    useEffect(() => {
      const stages = [
        'Analyzing conversation...',
        'Scouting locations...',
        'Creating storyboard...',
        'Generating visuals...'
      ];
      
      const interval = setInterval(() => {
        setStage(prev => (prev + 1) % stages.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }, []);
    
    const stages = [
      { label: 'Analyzing conversation', icon: '🎤' },
      { label: 'Scouting locations', icon: '📍' },
      { label: 'Creating storyboard', icon: '🎬' },
      { label: 'Generating visuals', icon: '🎨' }
    ];
    
    return (
      <div className="bg-gray-800 rounded-lg p-12">
        <div className="max-w-md mx-auto">
          {stages.map((s, idx) => (
            <div key={idx} className={`mb-6 transition-opacity ${idx <= stage ? 'opacity-100' : 'opacity-30'}`}>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{s.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{s.label}</p>
                  {idx === stage && (
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-loading" />
                    </div>
                  )}
                </div>
                {idx < stage && <span className="text-green-500">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }