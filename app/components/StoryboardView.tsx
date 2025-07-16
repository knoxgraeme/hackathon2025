// components/StoryboardView.tsx
'use client';

import { EdgeShot, EdgeLocation } from '../types/photo-session';
import { useState } from 'react';
import Image from 'next/image';
import { BottomSheet } from './BottomSheet';

// Create a minimal interface for locations used in the storyboard
interface StoryboardLocation {
  name: string;
}

interface StoryboardViewProps {
  shots: EdgeShot[];
  locations: StoryboardLocation[] | EdgeLocation[];
}

export function StoryboardView({ shots, locations }: StoryboardViewProps) {
  const [selectedShotIndex, setSelectedShotIndex] = useState<number | null>(null);
  const selectedShot = selectedShotIndex !== null ? shots[selectedShotIndex] : null;
  const selectedLocation = selectedShot && locations[selectedShot.locationIndex] ? 
    locations[selectedShot.locationIndex] as EdgeLocation : null;

  // Extract shot title from pose instruction (first sentence or phrase)
  const getShotTitle = (shot: EdgeShot) => {
    const firstSentence = shot.poseInstruction.split(/[.!?]/)[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 47) + '...' : firstSentence;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 gradient-text">
          Your Photo Storyboard
        </h2>
        <p className="text-secondary">{shots.length} unique shots across {locations.length} locations</p>
      </div>

      {/* Unified Storyboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shots.map((shot, idx) => (
          <div
            key={idx}
            className="cursor-pointer animate-slide-up"
            style={{ animationDelay: `${idx * 0.05}s` }}
            onClick={() => setSelectedShotIndex(idx)}
          >
            {/* Shot Card */}
            <div className="relative group">
              {/* Storyboard Image */}
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 relative">
                {shot.storyboardImage ? (
                  <>
                    <Image 
                      src={shot.storyboardImage} 
                      alt={`Shot ${shot.shotNumber}`}
                      fill
                      className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl opacity-50">📸</span>
                  </div>
                )}
                
                {/* Shot Number Badge */}
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{shot.shotNumber}</span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-sm text-white font-medium">View Details</span>
                  </div>
                </div>
              </div>

              {/* Shot Info Below Card */}
              <div className="mt-2 px-1">
                <p className="text-xs font-bold text-primary mb-0.5">Shot #{shot.shotNumber}</p>
                <p className="text-xs text-secondary line-clamp-2">{getShotTitle(shot)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sheet for Shot Details */}
      <BottomSheet
        isOpen={selectedShotIndex !== null}
        onClose={() => setSelectedShotIndex(null)}
        shot={selectedShot}
        location={selectedLocation}
      />

    </div>
  );
}