// components/SessionCard.tsx
'use client';

import Link from 'next/link';
import { EdgePhotoShootContext, EdgeLocation, EdgeShot } from '../types/photo-session';

/**
 * Session interface matching the SessionProvider structure
 */
interface Session {
  /** Unique identifier for the session */
  id: string;
  /** Current status of the photo session workflow */
  status: 'initial' | 'conversation' | 'processing' | 'complete';
  /** ElevenLabs conversation ID for voice interactions */
  conversationId?: string;
  /** Photo shoot context and metadata */
  context?: EdgePhotoShootContext;
  /** Array of selected shooting locations */
  locations?: EdgeLocation[];
  /** Array of generated photo shots */
  shots?: EdgeShot[];
  /** ISO timestamp of session creation */
  createdAt: string;
  /** Optional user-provided session title */
  title?: string;
}

/**
 * Props for the SessionCard component
 */
interface SessionCardProps {
  /** Session object containing all session data */
  session: Session;
}

/**
 * SessionCard - Displays a preview card for a photo session
 * 
 * This component renders a clickable card that shows:
 * - Cover image (first storyboard image if available)
 * - Session title or formatted date
 * - Number of locations and total shots
 * - Creation date and time
 * 
 * The card links to the full session detail page when clicked.
 * Sessions without locations are not rendered.
 * 
 * @param {SessionCardProps} props - The component props
 * @param {Session} props.session - The session data to display
 * @returns {JSX.Element | null} The rendered session card or null if no locations
 * 
 * @example
 * ```tsx
 * // In a session list
 * {sessions.map(session => (
 *   <SessionCard key={session.id} session={session} />
 * ))}
 * ```
 */
export function SessionCard({ session }: SessionCardProps) {
  if (!session.locations || session.locations.length === 0) {
    return null;
  }

  // Get the first storyboard image from shots
  const coverImage = session.shots?.[0]?.storyboardImage || null;

  // Calculate total shots across all locations (EdgeLocation doesn't have spots property)
  const totalShots = session.shots?.length || 0;

  return (
    <Link href={`/session/${session.id}`} className="block mb-6">
      <div className="rounded overflow-hidden border border-[#dedede] hover:border-[#00a887] transition-colors">
        {/* Cover Image */}
        {coverImage ? (
          <div className="h-[150px] w-full relative bg-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
          </div>
          
          <p className="text-[13px] text-[#0000008c] leading-[18px] mb-1">
            {session.locations.length} Locations • {totalShots} shots total
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