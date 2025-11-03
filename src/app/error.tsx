'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, RefreshCcw, Hammer, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur pour le debug
    console.error('Runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="error-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 80 20 L 80 60 L 40 80 L 0 60 L 0 20 Z" fill="none" stroke="rgba(0, 191, 191, 0.5)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#error-grid)" />
        </svg>
      </div>

      {/* Gradient accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        {/* Logo with animation */}
        <div className="flex justify-center mb-8 animate-fadeIn">
          <div 
            className="relative p-6 rounded-2xl bg-zinc-900 border-2 border-destructive/30"
            style={{ animation: 'scaleBreath 4s ease-in-out infinite' }}
          >
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
              alt="JHS Logo" 
              width={60} 
              height={60}
              className="object-contain"
            />
          </div>
        </div>

        {/* Error header with construction theme */}
        <div className="mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <AlertTriangle className="w-12 h-12 text-destructive animate-construction-pulse" />
            <h1 className="text-6xl sm:text-8xl font-black text-white">Oups !</h1>
            <Hammer className="w-12 h-12 text-primary animate-hammer-strike" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Problème sur le chantier
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-md mx-auto">
            Une erreur technique s'est produite. Nos équipes travaillent à la réparer.
          </p>
        </div>

        {/* Error details */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800 mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-zinc-300 text-sm leading-relaxed">
                <strong className="text-destructive">Erreur technique :</strong> Une erreur inattendue s'est produite lors du chargement de cette page.
              </p>
            </div>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                Détails techniques (mode développement)
              </summary>
              <pre className="mt-2 text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <Button 
            size="lg" 
            onClick={reset}
            className="gap-2 group rounded-xl bg-primary hover:bg-primary/90 hover:scale-105 text-white font-bold shadow-lg shadow-primary/20"
          >
            <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            Réessayer
          </Button>
          
          <Link href="/">
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 group rounded-xl border-zinc-600 bg-transparent hover:bg-zinc-800 text-white font-bold w-full sm:w-auto"
            >
              <Home className="h-5 w-5" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-xs text-zinc-500 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <p>Si le problème persiste, contactez-nous au 04 91 63 13 13</p>
          <p className="mt-1 text-zinc-600">JHS ENTREPRISE - 3 Avenue Claude Monet, 13014 Marseille</p>
        </div>
      </div>
    </div>
  );
}