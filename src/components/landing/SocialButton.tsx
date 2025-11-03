'use client';

import { useState } from 'react';

interface SocialButtonProps {
  platform: 'instagram' | 'facebook';
  username: string;
  handle: string;
  followers: string;
  url: string;
}

export function SocialButton({ 
  platform, 
  username, 
  handle, 
  followers, 
  url 
}: SocialButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const platformConfig = {
    instagram: {
      color: '#E4405F',
      gradient: 'from-purple-600 via-pink-500 to-orange-400',
      icon: (
        <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px]">
          <path
            fill="currentColor"
            d="M 9.9980469 3 C 6.1390469 3 3 6.1419531 3 10.001953 L 3 20.001953 C 3 23.860953 6.1419531 27 10.001953 27 L 20.001953 27 C 23.860953 27 27 23.858047 27 19.998047 L 27 9.9980469 C 27 6.1390469 23.858047 3 19.998047 3 L 9.9980469 3 z M 22 7 C 22.552 7 23 7.448 23 8 C 23 8.552 22.552 9 22 9 C 21.448 9 21 8.552 21 8 C 21 7.448 21.448 7 22 7 z M 15 9 C 18.309 9 21 11.691 21 15 C 21 18.309 18.309 21 15 21 C 11.691 21 9 18.309 9 15 C 9 11.691 11.691 9 15 9 z M 15 11 A 4 4 0 0 0 11 15 A 4 4 0 0 0 15 19 A 4 4 0 0 0 19 15 A 4 4 0 0 0 15 11 z"
          />
        </svg>
      )
    },
    facebook: {
      color: '#1877F2',
      gradient: 'from-blue-600 to-blue-500',
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px]">
          <path
            fill="currentColor"
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
        </svg>
      )
    }
  };

  const config = platformConfig[platform];

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof window === 'undefined') return;
    
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="relative cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      {/* Tooltip */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 p-2.5 rounded-2xl pointer-events-none transition-all duration-300 ${
          isOpen ? '-top-[140px] opacity-100 visible' : 'top-0 opacity-0 invisible'
        }`}
        style={{
          background: 'rgba(42, 43, 47, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'inset 5px 5px 5px rgba(0, 0, 0, 0.2), inset -5px -5px 15px rgba(255, 255, 255, 0.1), 5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.1)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className="bg-zinc-800/80 rounded-xl p-3 border border-primary/20 min-w-[180px]">
          <div className="flex gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg border"
              style={{ 
                borderColor: config.color,
                background: 'white'
              }}
            >
              <span style={{ color: config.color }}>JH</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={handleUsernameClick}
                className="text-sm font-bold hover:underline text-left focus:outline-none cursor-pointer"
                style={{ color: config.color }}
              >
                {username}
              </button>
              <div className="text-xs text-white">
                {handle}
              </div>
            </div>
          </div>
          <div className="text-xs text-zinc-400 pt-1.5 border-t border-zinc-700">
            {followers}
          </div>
        </div>
      </div>

      {/* Main Button */}
      <button 
        onClick={handleButtonClick}
        className="block relative bg-transparent border-0 p-0 cursor-pointer"
        aria-label={`Voir le profil ${platform} de ${username}`}
      >
        <div
          className="relative w-[55px] h-[55px]"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(-35deg) skew(20deg)' : 'rotate(0deg) skew(0deg)',
          }}
        >
          {/* Layered spans */}
          {[1, 2, 3, 4, 5].map((layer) => (
            <span
              key={layer}
              className="absolute inset-0 border rounded-md transition-all duration-300"
              style={{
                borderColor: config.color,
                opacity: isOpen ? layer * 0.2 : 1,
                transform: isOpen ? `translate(${layer * 5}px, ${-layer * 5}px)` : 'translate(0, 0)',
                boxShadow: isOpen ? `0 0 10px ${config.color}40` : 'none',
                transitionDelay: `${layer * 50}ms`,
              }}
            >
              {layer === 5 && (
                <span 
                  className="absolute inset-0 flex items-center justify-center bg-black rounded-md"
                  style={{ color: config.color }}
                >
                  {config.icon}
                </span>
              )}
            </span>
          ))}
        </div>
      </button>
    </div>
  );
}