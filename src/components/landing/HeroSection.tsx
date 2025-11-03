'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <div className="text-center mb-16">
        <div className="flex justify-center mb-10 animate-fadeIn">
          <div 
            className="relative p-8 rounded-2xl bg-zinc-900 border-2 border-primary/30 hover:border-primary/50 transition-all duration-500"
            style={{
              animation: 'scaleBreath 4s ease-in-out infinite',
            }}
          >
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
              alt="JHS Logo" 
              width={80} 
              height={80}
              className="object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight animate-fadeIn">
          <span className="text-white">Votre Intranet</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
            Nouvelle Génération
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <strong className="text-white">JHS ENTREPRISE</strong> - Expert dans le BTP depuis plus de 30 ans. 
          Une plateforme digitale complète pour gérer vos chantiers en toute simplicité.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <Link href="/login">
            <Button 
              size="lg" 
              className="text-lg h-14 px-10 gap-3 group rounded-xl bg-primary hover:bg-primary/90 hover:scale-105 text-white font-bold shadow-lg shadow-primary/20"
              aria-label="Accéder à la plateforme JHS Entreprise"
            >
              Accéder à la plateforme
              <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
