import { Hammer, Wrench, HardHat, Clock } from 'lucide-react';
import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="maintenance-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 80 20 L 80 60 L 40 80 L 0 60 L 0 20 Z" fill="none" stroke="rgba(0, 191, 191, 0.5)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#maintenance-grid)" />
        </svg>
      </div>

      {/* Gradient accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Floating construction icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Hammer className="absolute top-[20%] left-[10%] w-8 h-8 text-primary/20 animate-float-up" />
        <Wrench className="absolute top-[60%] right-[15%] w-10 h-10 text-cyan-400/20 animate-float-up" style={{ animationDelay: '0.5s' }} />
        <HardHat className="absolute bottom-[30%] left-[20%] w-12 h-12 text-primary/20 animate-float-up" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        {/* Logo with animation */}
        <div className="flex justify-center mb-10 animate-fadeIn">
          <div 
            className="relative p-8 rounded-2xl bg-zinc-900 border-2 border-primary/30"
            style={{ animation: 'scaleBreath 4s ease-in-out infinite' }}
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

        {/* Main message */}
        <div className="mb-10 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Hammer className="w-12 h-12 text-primary animate-hammer-strike" />
            <Wrench className="w-12 h-12 text-cyan-400 animate-drill-spin" />
            <HardHat className="w-12 h-12 text-primary animate-bounce-slow" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">
            Maintenance en cours
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Nous améliorons votre plateforme <strong className="text-primary">JHS ENTREPRISE</strong>. 
            Le chantier sera terminé très bientôt !
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Durée estimée</h3>
            <p className="text-sm text-zinc-400">Quelques heures</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <Hammer className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Amélioration</h3>
            <p className="text-sm text-zinc-400">Nouvelles fonctionnalités</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <Wrench className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Optimisation</h3>
            <p className="text-sm text-zinc-400">Performance & sécurité</p>
          </div>
        </div>

        {/* Status message */}
        <div className="bg-gradient-to-br from-primary/10 to-cyan-400/10 rounded-2xl p-8 border border-primary/20 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          <p className="text-zinc-300 leading-relaxed mb-4">
            Notre équipe technique travaille actuellement sur la maintenance et l'amélioration de la plateforme. 
            Toutes vos données sont en sécurité et seront disponibles dès que nous aurons terminé.
          </p>
          <p className="text-sm text-zinc-400">
            <strong className="text-primary">Besoin d'aide urgente ?</strong><br />
            Contactez-nous au <a href="tel:0491631313" className="text-primary hover:underline">04 91 63 13 13</a> ou par email à <a href="mailto:contact@jhsentreprise.fr" className="text-primary hover:underline">contact@jhsentreprise.fr</a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-zinc-500 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <p>© 2025 JHS ENTREPRISE - Expert BTP depuis 1990</p>
        </div>
      </div>
    </div>
  );
}
