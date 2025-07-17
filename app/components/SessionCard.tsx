// components/SessionCard.tsx
'use client';

import Link from 'next/link';
import { Session } from '../types/models';

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  if (!session.locations || session.locations.length === 0) {
    return null;
  }

  // Get the first storyboard image from shots
  const coverImage = session.shots?.[0]?.storyboardImage || null;

  // Calculate total spots across all locations
  const totalSpots = session.locations.reduce((sum, location) => 
    sum + (location.spots?.length || 0), 0
  );

  return (
    <Link href={`/session/${session.id}`} className="block mb-6">
      <div className="rounded overflow-hidden border border-[#dedede] hover:border-[#00a887] transition-colors">
        {/* Cover Image */}
        {coverImage ? (
          <div className="h-[135px] w-full relative bg-gray-200">
            <img 
              src={coverImage} 
              alt={session.title || 'Session cover'}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', coverImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="h-[135px] w-full bg-gray-200" />
        )}
        
        {/* Session Details */}
        <div className="p-4 bg-white">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-[17px] font-semibold text-[#343434] leading-[22px]">
              {session.title || `Session ${new Date(session.createdAt).toLocaleDateString()}`}
            </h3>
            {session.status === 'complete' && (
              <svg className="w-5 h-5 text-[#00a887] flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          
          <p className="text-[13px] text-[#0000008c] leading-[18px] mb-1">
            {session.locations.length} Locations • {totalSpots} spots total
          </p>
          
          <p className="text-[13px] text-[#0000008c] leading-[18px]">
            {new Date(session.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}