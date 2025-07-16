// components/LocationsList.tsx
'use client';

interface Location {
  name: string;
  address?: string;
  description: string;
  bestTime: string;
  lightingNotes: string;
  accessibility: string;
  permits: string;
  alternatives: string[];
}

interface LocationsListProps {
  locations: Location[];
}

export function LocationsList({ locations }: LocationsListProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Recommended Locations</h2>
      <div className="space-y-4">
        {locations.map((location, idx) => (
          <div key={idx} className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{location.name}</h3>
            {location.address && (
              <p className="text-sm text-gray-400 mb-2">{location.address}</p>
            )}
            <p className="text-gray-300 mb-3">{location.description}</p>
            
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Best Time:</span> {location.bestTime}
              </div>
              <div>
                <span className="text-gray-400">Lighting:</span> {location.lightingNotes}
              </div>
              <div>
                <span className="text-gray-400">Access:</span> {location.accessibility}
              </div>
              <div>
                <span className="text-gray-400">Permits:</span> {location.permits}
              </div>
            </div>
            
            {location.alternatives.length > 0 && (
              <div className="mt-3 text-sm">
                <span className="text-gray-400">Alternatives:</span>
                <ul className="list-disc list-inside text-gray-300 mt-1">
                  {location.alternatives.map((alt, altIdx) => (
                    <li key={altIdx}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}