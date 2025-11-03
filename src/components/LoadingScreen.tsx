'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const funMessages = [
  "On pose les briques...",
  "On mélange le béton...",
  "On prépare la truelle...",
  "On monte l'échafaudage...",
  "Construction en cours...",
  "Presque prêt !",
];

export function LoadingScreen() {
  const [message, setMessage] = useState(funMessages[0]);
  const [bricks, setBricks] = useState<number[]>([]);

  useEffect(() => {
    // Rotate messages
    const messageInterval = setInterval(() => {
      setMessage(funMessages[Math.floor(Math.random() * funMessages.length)]);
    }, 2000);

    // Add bricks animation
    const brickInterval = setInterval(() => {
      setBricks(prev => {
        if (prev.length >= 8) return [];
        return [...prev, prev.length];
      });
    }, 300);

    return () => {
      clearInterval(messageInterval);
      clearInterval(brickInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-primary/30 rounded-full animate-bounce-slow" />
        <div className="absolute top-40 right-32 w-3 h-3 bg-cyan-400/20 rounded-full animate-bounce-slow" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-primary/40 rounded-full animate-bounce-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-cyan-400/30 rounded-full animate-bounce-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Animated bricks building up */}
        <div className="flex gap-2 h-12 items-end">
          {bricks.map((brick, index) => (
            <div
              key={brick}
              className="w-8 h-8 bg-primary/80 rounded border-2 border-primary/30"
              style={{
                animation: 'brickBuild 0.4s ease-out',
                animationDelay: `${index * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Loading spinner with construction theme */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
          <div 
            className="absolute inset-0 border-4 border-transparent border-t-primary border-r-cyan-400 rounded-full animate-spin"
            style={{ animationDuration: '1.5s' }}
          />
          <div className="absolute inset-3 bg-zinc-900/50 backdrop-blur rounded-full flex items-center justify-center">
            <span className="text-2xl">🔨</span>
          </div>
        </div>

        {/* Fun message */}
        <div className="text-center space-y-2">
          <p className="text-xl font-bold text-white animate-pulse">
            {message}
          </p>
          <p className="text-sm text-zinc-400">
            JHS ENTREPRISE • Chargement
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary animate-shimmer"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
    </div>
  );
}