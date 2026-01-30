'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

export default function MobileNavbar() {
  const pathname = usePathname();
  const { isAuthenticated, userRole } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();

  // Navigation items
  const navItems = [
    { 
      name: 'Home', 
      href: '/', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Explore', 
      href: '/explore', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    { 
      name: 'Community', 
      href: '/community', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Upload', 
      href: '/upload', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    { 
      name: 'Library', 
      href: isAuthenticated ? '/profile' : '/login', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    }
  ];

  // Active link checker
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-2xl mobile-navbar-container" style={{ paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 9999 }} data-testid="mobile-navbar">
      {/* Player bar when track is playing */}
      {currentTrack && (
        <div className="bg-gray-900 border-t border-gray-700">
          <Link 
            href="/player" 
            className="flex items-center p-2 gap-2 active:scale-95 transition-transform duration-200 min-h-[40px]"
          >
            <img 
              src={currentTrack.coverImage} 
              alt={currentTrack.title} 
              className="w-8 h-8 rounded object-cover border border-gray-700 flex-shrink-0"
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-white text-xs font-medium truncate leading-tight">{currentTrack.title}</p>
              <p className="text-gray-300 text-[10px] truncate leading-tight mt-0.5">{currentTrack.artist}</p>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                togglePlayPause();
              }}
              className="w-6 h-6 rounded-full bg-[#FF4D67] flex items-center justify-center active:scale-95 transition-transform duration-200 shadow-lg flex-shrink-0"
            >
              {isPlaying ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </Link>
        </div>
      )}
      
      {/* Navigation bar */}
      <div className="bg-gray-900/80 backdrop-blur-lg border-t border-gray-800">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-2 active:scale-95 transition-transform duration-200 ${
                isActive(item.href)
                  ? 'text-[#FF4D67] font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <div className={`${isActive(item.href) ? 'text-[#FF4D67]' : 'text-gray-300'} scale-90`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Floating Player Button when no track is playing */}
      {!currentTrack && (
        <Link 
          href="/player"
          className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#FF4D67] flex items-center justify-center shadow-xl active:scale-95 transition-transform duration-200 ring-2 ring-white/20"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </Link>
      )}
    </div>
  );
}