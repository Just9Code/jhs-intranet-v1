'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ParticleNetwork } from '@/components/landing/ParticleNetwork';
import { IsometricGrid } from '@/components/landing/IsometricGrid';
import { FloatingBadges } from '@/components/landing/FloatingBadges';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ValuesSection } from '@/components/landing/ValuesSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { CTACard } from '@/components/landing/CTACard';
import { Footer } from '@/components/landing/Footer';

// ✅ Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isLoading && user) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, isLoading, router, isHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Show loading screen while redirecting authenticated users
  if (!isHydrated || isLoading || (user && isRedirecting)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-primary/30 shadow-xl">
              <Image 
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
                alt="JHS Logo" 
                width={48} 
                height={48}
                className="object-contain animate-pulse"
              />
            </div>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white/70 text-lg font-medium">
            {isRedirecting ? 'Redirection vers votre tableau de bord...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <ParticleNetwork />
      <IsometricGrid />
      <FloatingBadges />

      {/* Gradient accents */}
      <div 
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl animate-pulse pointer-events-none"
        style={{ 
          animationDuration: '4s',
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse pointer-events-none"
        style={{ 
          animationDuration: '6s', 
          animationDelay: '1s',
          transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* Navigation Header */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div 
                className="relative p-2.5 rounded-xl bg-zinc-900 border border-primary/30 group-hover:border-primary/50 transition-all duration-300"
                style={{ animation: 'oscillate 4s ease-in-out infinite' }}
              >
                <div className="absolute inset-0 bg-primary/5 rounded-xl" />
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
                  alt="JHS Logo" 
                  width={28} 
                  height={28}
                  className="object-contain relative z-10"
                />
              </div>
              <span className="text-2xl font-bold text-white">JHS ENTREPRISE</span>
            </div>
            <Link href="/login">
              <Button 
                size="lg" 
                className="gap-2 group rounded-xl transition-all duration-300 bg-primary hover:bg-primary/90 hover:scale-105 text-white font-bold shadow-lg shadow-primary/20"
                aria-label="Se connecter à l'intranet"
              >
                Se connecter
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ValuesSection />
        <ContactSection />
        <CTACard />
      </main>

      <Footer />
    </div>
  );
}