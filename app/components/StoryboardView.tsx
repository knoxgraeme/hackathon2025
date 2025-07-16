// components/StoryboardView.tsx
'use client';

import { EdgeShot, EdgeLocation } from '../types/photo-session';
import { useState } from 'react';
import { Button } from './Button';

// Create a minimal interface for locations used in the storyboard
interface StoryboardLocation {
  name: string;
}

interface StoryboardViewProps {
  shots: EdgeShot[];
  locations: StoryboardLocation[] | EdgeLocation[];
}

export function StoryboardView({ shots, locations }: StoryboardViewProps) {
  const [selectedShot, setSelectedShot] = useState<number | null>(null);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 gradient-text">
          Your Photo Storyboard
        </h2>
        <p className="text-secondary">{shots.length} unique shots across {locations.length} locations</p>
      </div>

      {/* Shot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shots.map((shot, idx) => (
          <div
            key={idx}
            className={`
              glass-card p-5 cursor-pointer transition-all duration-300
              hover:scale-105 hover:bg-white/15
              ${selectedShot === idx ? 'ring-2 ring-blue-500 scale-105' : ''}
              animate-slide-up stagger-${Math.min(idx + 1, 6)}
            `}
            onClick={() => setSelectedShot(selectedShot === idx ? null : idx)}
          >
            {/* Shot Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">📸</span>
                  <span className="text-sm text-tertiary font-medium">Shot #{shot.shotNumber}</span>
                </div>
                <p className="font-semibold text-lg text-primary">
                  {locations[shot.locationIndex]?.name || 'Location'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                <span className="text-xs font-bold">{shot.shotNumber}</span>
              </div>
            </div>
            
            {/* Storyboard Image */}
            {shot.storyboardImage && (
              <div className="mb-4 aspect-video rounded-xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                <img 
                  src={shot.storyboardImage} 
                  alt={`Storyboard for shot ${shot.shotNumber}`}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <span className="text-xs text-white/80 backdrop-blur-sm bg-black/30 px-2 py-1 rounded-full">
                    AI Generated
                  </span>
                </div>
              </div>
            )}
            
            {/* Shot Details */}
            <div className={`space-y-3 ${selectedShot === idx ? 'block' : 'block'}`}>
              {/* Pose Instruction */}
              <div className="glass-card-dark p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🎭</span>
                  <div className="flex-1">
                    <p className="text-xs text-tertiary mb-1 font-medium uppercase tracking-wider">Pose</p>
                    <p className="text-sm text-secondary leading-relaxed">{shot.poseInstruction}</p>
                  </div>
                </div>
              </div>
              
              {/* Technical Notes */}
              <div className="glass-card-dark p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚙️</span>
                  <div className="flex-1">
                    <p className="text-xs text-tertiary mb-1 font-medium uppercase tracking-wider">Technical</p>
                    <p className="text-sm text-secondary leading-relaxed">{shot.technicalNotes}</p>
                  </div>
                </div>
              </div>
              
              {/* Equipment */}
              {shot.equipment.length > 0 && (
                <div className="glass-card-dark p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📷</span>
                    <div className="flex-1">
                      <p className="text-xs text-tertiary mb-1 font-medium uppercase tracking-wider">Equipment</p>
                      <div className="flex flex-wrap gap-2">
                        {shot.equipment.map((item, i) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-white/10 text-secondary"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expand Indicator */}
            <div className="mt-4 text-center">
              <span className="text-xs text-tertiary">
                {selectedShot === idx ? 'Tap to minimize' : 'Tap for details'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile-Friendly Action Buttons */}
      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          variant="secondary"
          icon={<span>💾</span>}
        >
          Save Storyboard
        </Button>
        <Button 
          variant="secondary"
          icon={<span>📤</span>}
        >
          Share Plan
        </Button>
        <Button 
          variant="secondary"
          icon={<span>🖨️</span>}
        >
          Print Cards
        </Button>
      </div>
    </div>
  );
}