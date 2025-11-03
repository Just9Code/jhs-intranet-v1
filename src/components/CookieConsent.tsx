'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings } from 'lucide-react';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after 1 second delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryOnly));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          showBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Cookie Banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 transition-transform duration-500 ease-out ${
          showBanner ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-zinc-900 border-2 border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Settings Panel */}
            {showSettings ? (
              <div className="p-6 sm:p-8 animate-fadeIn">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-bold text-white">Paramètres des cookies</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Necessary cookies */}
                  <div className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">Cookies nécessaires</h4>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Requis</span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        Essentiels au fonctionnement du site (authentification, sécurité, préférences de base).
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-5 h-5 rounded accent-primary cursor-not-allowed opacity-50"
                      />
                    </div>
                  </div>

                  {/* Functional cookies */}
                  <div className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Cookies fonctionnels</h4>
                      <p className="text-sm text-zinc-400">
                        Améliorent l'expérience utilisateur (mémorisation des préférences, personnalisation).
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                        className="w-5 h-5 rounded accent-primary cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Analytics cookies */}
                  <div className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Cookies analytiques</h4>
                      <p className="text-sm text-zinc-400">
                        Nous aident à comprendre comment vous utilisez le site pour l'améliorer (statistiques anonymes).
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="w-5 h-5 rounded accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={savePreferences}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    Enregistrer mes préférences
                  </Button>
                  <Button
                    onClick={acceptAll}
                    variant="outline"
                    className="flex-1 border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-white font-semibold"
                  >
                    Tout accepter
                  </Button>
                </div>
              </div>
            ) : (
              /* Main Banner */
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <Cookie className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      🍪 Nous utilisons des cookies
                    </h3>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                      Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                      En cliquant sur "Tout accepter", vous consentez à l'utilisation de TOUS les cookies. 
                      Vous pouvez gérer vos préférences à tout moment.
                    </p>
                    <p className="text-xs text-zinc-400">
                      Pour plus d'informations, consultez notre{' '}
                      <Link href="/politique-confidentialite" className="text-primary hover:underline">
                        politique de confidentialité
                      </Link>
                      .
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[200px]">
                    <Button
                      onClick={acceptAll}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      Tout accepter
                    </Button>
                    <Button
                      onClick={acceptNecessary}
                      variant="outline"
                      className="w-full border-zinc-700 hover:bg-zinc-800 text-white"
                    >
                      Nécessaires uniquement
                    </Button>
                    <Button
                      onClick={() => setShowSettings(true)}
                      variant="ghost"
                      className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Personnaliser
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
