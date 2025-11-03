'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Hammer } from 'lucide-react';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="not-found-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 80 20 L 80 60 L 40 80 L 0 60 L 0 20 Z" fill="none" stroke="rgba(0, 191, 191, 0.5)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#not-found-grid)" />
        </svg>
      </div>

      {/* Gradient accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        {/* Logo with animation */}
        <div className="flex justify-center mb-8 animate-fadeIn">
          <div 
            className="relative p-6 rounded-2xl bg-zinc-900 border-2 border-primary/30"
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

        {/* 404 with construction theme */}
        <div className="mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Hammer className="w-12 h-12 text-primary animate-hammer-strike" />
            <h1 className="text-8xl font-black text-white">404</h1>
            <Hammer className="w-12 h-12 text-primary animate-hammer-strike" style={{ animationDelay: '0.3s' }} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Chantier introuvable
          </h2>
          <p className="text-lg text-zinc-400 max-w-md mx-auto">
            Cette page est en zone de construction non autorisée. 
            Retournez à l'accueil pour reprendre le chantier !
          </p>
        </div>

        {/* Construction-themed error message */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800 mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <p className="text-zinc-300 text-sm leading-relaxed">
            <strong className="text-primary">Erreur technique :</strong> La page que vous cherchez n'existe pas, 
            a été déplacée ou est temporairement inaccessible. Vérifiez l'URL ou retournez à la page d'accueil.
          </p>
        </div>

        {/* Action button */}
        <div className="flex justify-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <Link href="/">
            <Button 
              size="lg" 
              className="gap-2 group rounded-xl bg-primary hover:bg-primary/90 hover:scale-105 text-white font-bold shadow-lg shadow-primary/20"
            >
              <Home className="h-5 w-5" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-xs text-zinc-500 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <p>Si le problème persiste, contactez-nous au 04 91 63 13 13</p>
        </div>
      </div>
    </div>
  );
}