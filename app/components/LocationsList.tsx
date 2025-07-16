// components/LocationsList.tsx
'use client';

import { EdgeLocation } from '../types/photo-session';
import { useState } from 'react';

interface LocationsListProps {
  locations: EdgeLocation[];
}

export function LocationsList({ locations }: LocationsListProps) {
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 gradient-text">
          Perfect Locations for Your Shoot
        </h2>
        <p className="text-secondary">{locations.length} curated spots in Vancouver</p>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((location, idx) => (
          <div 
            key={idx} 
            className={`
              glass-card p-4 sm:p-6 cursor-pointer transition-all duration-300
              hover:scale-102 hover:bg-white/15
              ${expandedLocation === idx ? 'md:col-span-2' : ''}
              animate-slide-up stagger-${Math.min(idx + 1, 6)}
            `}
            onClick={() => setExpandedLocation(expandedLocation === idx ? null : idx)}
          >
            {/* Location Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">📍</span>
                  <h3 className="font-bold text-xl text-primary">{location.name}</h3>
                </div>
                {location.address && (
                  <p className="text-sm text-secondary ml-0 sm:ml-12">{location.address}</p>
                )}
              </div>
              <div className="glass-card-dark px-3 py-1 rounded-full">
                <span className="text-xs font-medium">#{idx + 1}</span>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-secondary mb-4 leading-relaxed ml-0 sm:ml-12">
              {location.description}
            </p>
            
            {/* Key Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 ml-0 sm:ml-12">
              <div className="glass-card-dark p-2 sm:p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span>🌅</span>
                  <div>
                    <p className="text-xs text-tertiary uppercase tracking-wider">Best Time</p>
                    <p className="text-sm text-primary font-medium">{location.bestTime}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card-dark p-2 sm:p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span>💡</span>
                  <div>
                    <p className="text-xs text-tertiary uppercase tracking-wider">Lighting</p>
                    <p className="text-sm text-primary font-medium">{location.lightingNotes}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card-dark p-2 sm:p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span>🚶</span>
                  <div>
                    <p className="text-xs text-tertiary uppercase tracking-wider">Access</p>
                    <p className="text-sm text-primary font-medium">{location.accessibility}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card-dark p-2 sm:p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span>📋</span>
                  <div>
                    <p className="text-xs text-tertiary uppercase tracking-wider">Permits</p>
                    <p className="text-sm text-primary font-medium">{location.permits}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Alternatives (show on expansion) */}
            {location.alternatives.length > 0 && expandedLocation === idx && (
              <div className="mt-4 ml-0 sm:ml-12 glass-card-dark p-4 rounded-lg animate-slide-up">
                <p className="text-sm text-tertiary mb-2 font-medium uppercase tracking-wider">
                  Alternative Spots Nearby
                </p>
                <div className="space-y-2">
                  {location.alternatives.map((alt, altIdx) => (
                    <div key={altIdx} className="flex items-center gap-2">
                      <span className="text-xs">•</span>
                      <span className="text-sm text-secondary">{alt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Preview (placeholder for future) */}
            {expandedLocation === idx && (
              <div className="mt-4 ml-0 sm:ml-12 glass-card-dark p-4 rounded-lg animate-slide-up text-center">
                <div className="h-32 flex items-center justify-center">
                  <div>
                    <span className="text-4xl">🗺️</span>
                    <p className="text-sm text-tertiary mt-2">Interactive map coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Expand Indicator */}
            <div className="text-center mt-4">
              <span className="text-xs text-tertiary">
                {expandedLocation === idx ? 'Tap to minimize' : 'Tap for more details'}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}