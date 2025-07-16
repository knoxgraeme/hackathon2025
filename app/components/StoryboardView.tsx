// components/StoryboardView.tsx
'use client';

interface Shot {
  locationIndex: number;
  shotNumber: number;
  imagePrompt: string;
  poseInstruction: string;
  technicalNotes: string;
  equipment: string[];
  storyboardImage?: string;
}

interface Location {
  name: string;
}

interface StoryboardViewProps {
  shots: Shot[];
  locations: Location[];
}

export function StoryboardView({ shots, locations }: StoryboardViewProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Shot Storyboard</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shots.map((shot, idx) => (
          <div key={idx} className="border border-gray-700 rounded-lg p-4">
            <div className="mb-3">
              <span className="text-sm text-gray-400">Shot #{shot.shotNumber}</span>
              <p className="font-medium">{locations[shot.locationIndex]?.name || 'Location'}</p>
            </div>
            
            {shot.storyboardImage && (
              <div className="mb-3 aspect-video bg-gray-700 rounded overflow-hidden">
                <img 
                  src={shot.storyboardImage} 
                  alt={`Storyboard for shot ${shot.shotNumber}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-400">Pose:</p>
                <p className="text-gray-300">{shot.poseInstruction}</p>
              </div>
              
              <div>
                <p className="text-gray-400">Technical:</p>
                <p className="text-gray-300">{shot.technicalNotes}</p>
              </div>
              
              {shot.equipment.length > 0 && (
                <div>
                  <p className="text-gray-400">Equipment:</p>
                  <p className="text-gray-300">{shot.equipment.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}