'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '../providers/SessionProvider';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  activeIcon: string;
  path: string;
  action?: () => void;
}

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { createNewSession } = useSession();

  const handleNewSession = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      activeIcon: '🏠',
      path: '/'
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: '📁',
      activeIcon: '📂',
      path: '/sessions'
    },
    {
      id: 'camera',
      label: 'New',
      icon: '📸',
      activeIcon: '📸',
      path: '#',
      action: handleNewSession
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      activeIcon: '👤',
      path: '/profile'
    }
  ];

  const isActive = (item: NavItem) => {
    if (item.id === 'home') return pathname === '/';
    if (item.id === 'sessions') return pathname === '/' || pathname.startsWith('/session/');
    return pathname.startsWith(item.path);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else if (item.path !== '#') {
      router.push(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Blur background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-t border-white/10" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const isCameraButton = item.id === 'camera';
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`
                flex flex-col items-center justify-center
                transition-all duration-200
                ${isCameraButton ? 'relative -mt-4' : 'flex-1 h-full'}
              `}
            >
              {isCameraButton ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 shadow-lg transform active:scale-95 transition-transform">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className={`text-2xl transition-transform ${active ? 'scale-110' : ''}`}>
                    {active ? item.activeIcon : item.icon}
                  </span>
                  <span className={`
                    text-xs mt-1 transition-colors
                    ${active ? 'text-white' : 'text-white/60'}
                  `}>
                    {item.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}