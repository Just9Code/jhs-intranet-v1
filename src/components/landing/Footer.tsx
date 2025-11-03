'use client';

import { Building2, Shield, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SocialButton } from './SocialButton';

export function Footer() {
  const handleExternalLink = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (typeof window === 'undefined') return;
    
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16">
          {/* Company Info & Tagline */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-primary/30">
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
                  alt="JHS Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">JHS ENTREPRISE</span>
            </div>
            <p className="text-base font-semibold text-primary mb-3 leading-relaxed">
              Bâtir l'excellence,<br />inspirer la confiance
            </p>
            <div className="flex items-center gap-2 text-zinc-400 mb-4">
              <Building2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-sm">Depuis 1990</span>
            </div>
            <p className="text-sm text-zinc-500">
              Plus de 35 ans d'expertise dans le BTP à Marseille et 04.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Liens rapides</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-zinc-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  Connexion Intranet
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.jhsentreprise.fr" 
                  onClick={handleExternalLink("https://www.jhsentreprise.fr")}
                  className="text-zinc-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group"
                >
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  Site Vitrine
                </a>
              </li>
              <li>
                <a 
                  href="#features" 
                  className="text-zinc-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group"
                >
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  Nos Services
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-4">
              <li>
                <a 
                  href="tel:0491631313" 
                  className="flex items-start gap-3 text-zinc-400 hover:text-primary transition-colors group"
                  aria-label="Appeler le 04 91 63 13 13"
                >
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-primary/30 transition-colors">
                    <Phone className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">Téléphone</div>
                    <div className="text-sm font-medium text-white">04 91 63 13 13</div>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contact@jhsentreprise.fr" 
                  className="flex items-start gap-3 text-zinc-400 hover:text-primary transition-colors group"
                  aria-label="Envoyer un email à contact@jhsentreprise.fr"
                >
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-primary/30 transition-colors">
                    <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">Email</div>
                    <div className="text-sm font-medium text-white break-all">contact@jhsentreprise.fr</div>
                  </div>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">Localisation</div>
                    <div className="text-sm font-medium text-white">Marseille | Barrême, France</div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Suivez-nous</h3>
            <div className="flex gap-4">
              <SocialButton
                platform="instagram"
                username="jhsentreprise"
                handle="@jhsentreprise"
                followers="Suivez-nous"
                url="https://instagram.com/jhsentreprise"
              />
              <SocialButton
                platform="facebook"
                username="JHS Entreprise"
                handle="@jhsentreprise04"
                followers="Suivez-nous"
                url="https://facebook.com/jhsentreprise04"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-6 leading-relaxed">
              Rejoignez notre communauté pour suivre nos projets et actualités
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-500 text-center md:text-left">
              © 1990-2025 JHS ENTREPRISE. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6 text-xs text-zinc-500">
              <span className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-primary" aria-hidden="true" />
                Plateforme sécurisée
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-2">
                <Building2 className="w-3 h-3 text-primary" aria-hidden="true" />
                RGE QUALIBAT
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}