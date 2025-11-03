'use client';

import { Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function CTACard() {
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex justify-center">
        <div 
          className="relative"
          style={{ 
            width: '350px',
            height: '400px',
            perspective: '1000px'
          }}
        >
          <div 
            className="relative h-full rounded-[50px] transition-all duration-500 ease-in-out group"
            style={{
              background: 'linear-gradient(135deg, rgb(0, 191, 191) 0%, rgb(0, 166, 166) 100%)',
              transformStyle: 'preserve-3d',
              transform: 'rotate3d(1, 1, 0, 15deg)',
              boxShadow: 'rgba(0, 71, 71, 0.2) 20px 30px 25px -40px, rgba(0, 71, 71, 0.2) 0px 25px 25px -5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'rotate3d(1, 1, 0, 30deg)';
              e.currentTarget.style.boxShadow = 'rgba(0, 71, 71, 0.3) 30px 50px 25px -40px, rgba(0, 71, 71, 0.1) 0px 25px 30px 0px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'rotate3d(1, 1, 0, 15deg)';
              e.currentTarget.style.boxShadow = 'rgba(0, 71, 71, 0.2) 20px 30px 25px -40px, rgba(0, 71, 71, 0.2) 0px 25px 25px -5px';
            }}
          >
            {/* Glass layer */}
            <div 
              className="absolute rounded-[55px] transition-all duration-500"
              style={{
                inset: '8px',
                borderTopRightRadius: '100%',
                background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.349) 0%, rgba(255, 255, 255, 0.815) 100%)',
                transform: 'translate3d(0px, 0px, 25px)',
                borderLeft: '1px solid white',
                borderBottom: '1px solid white',
                transformStyle: 'preserve-3d',
              }}
            />

            {/* Content */}
            <div 
              className="relative px-8 pt-28 pb-6"
              style={{
                transform: 'translate3d(0, 0, 26px)',
              }}
            >
              <span className="block font-black text-2xl mb-5" style={{ color: '#006666' }}>
                PRÊT À DÉMARRER ?
              </span>
              <span className="block text-base leading-relaxed" style={{ color: 'rgba(0, 102, 102, 0.85)' }}>
                Rejoignez JHS ENTREPRISE et transformez votre gestion quotidienne
              </span>
            </div>

            {/* Bottom section */}
            <div 
              className="absolute bottom-5 left-5 right-5 flex items-center justify-between"
              style={{
                transform: 'translate3d(0, 0, 26px)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Social buttons */}
              <div className="flex gap-3" style={{ transformStyle: 'preserve-3d' }}>
                <a
                  href="https://instagram.com/jhsentreprise"
                  onClick={handleExternalLink("https://instagram.com/jhsentreprise")}
                  className="w-9 h-9 bg-white rounded-full border-none flex items-center justify-center transition-all duration-200 hover:bg-black hover:scale-110 group/social"
                  style={{
                    boxShadow: 'rgba(0, 71, 71, 0.5) 0px 7px 5px -5px',
                    transitionDelay: '0.4s',
                  }}
                  aria-label="Suivre JHS Entreprise sur Instagram"
                >
                  <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current transition-colors" style={{ fill: '#006666' }}>
                    <path d="M 9.9980469 3 C 6.1390469 3 3 6.1419531 3 10.001953 L 3 20.001953 C 3 23.860953 6.1419531 27 10.001953 27 L 20.001953 27 C 23.860953 27 27 23.858047 27 19.998047 L 27 9.9980469 C 27 6.1390469 23.858047 3 19.998047 3 L 9.9980469 3 z M 22 7 C 22.552 7 23 7.448 23 8 C 23 8.552 22.552 9 22 9 C 21.448 9 21 8.552 21 8 C 21 7.448 21.448 7 22 7 z M 15 9 C 18.309 9 21 11.691 21 15 C 21 18.309 18.309 21 15 21 C 11.691 21 9 18.309 9 15 C 9 11.691 11.691 9 15 9 z M 15 11 A 4 4 0 0 0 11 15 A 4 4 0 0 0 15 19 A 4 4 0 0 0 19 15 A 4 4 0 0 0 15 11 z"></path>
                  </svg>
                </a>

                <a
                  href="https://facebook.com/jhsentreprise04"
                  onClick={handleExternalLink("https://facebook.com/jhsentreprise04")}
                  className="w-9 h-9 bg-white rounded-full border-none flex items-center justify-center transition-all duration-200 hover:bg-black group/social"
                  style={{
                    boxShadow: 'rgba(0, 71, 71, 0.5) 0px 7px 5px -5px',
                    transitionDelay: '0.6s',
                  }}
                  aria-label="Suivre JHS Entreprise sur Facebook"
                >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current transition-colors" style={{ fill: '#006666' }}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                  </svg>
                </a>

                <a
                  href="tel:0491631313"
                  className="w-9 h-9 bg-white rounded-full border-none flex items-center justify-center transition-all duration-200 hover:bg-black group/social"
                  style={{
                    boxShadow: 'rgba(0, 71, 71, 0.5) 0px 7px 5px -5px',
                    transitionDelay: '0.8s',
                  }}
                  aria-label="Appeler le 04 91 63 13 13"
                >
                  <Phone className="w-4 h-4 transition-colors" style={{ color: '#006666' }} />
                </a>
              </div>

              {/* View more button */}
              <Link 
                href="/login"
                className="flex items-center gap-2 transition-all duration-200 hover:scale-110"
                style={{
                  transform: 'translate3d(0, 0, 10px)',
                }}
                aria-label="Commencer avec JHS Entreprise"
              >
                <button className="bg-transparent border-none font-bold text-sm" style={{ color: '#006666' }}>
                  Commencer
                </button>
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#006666" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </Link>
            </div>

            {/* Logo circles */}
            <div 
              className="absolute right-0 top-0"
              style={{ transformStyle: 'preserve-3d' }}
              aria-hidden="true"
            >
              <LogoCircles />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoCircles() {
  return (
    <>
      {/* Circle 1 */}
      <span 
        className="block absolute rounded-full top-2 right-2 transition-all duration-500"
        style={{
          width: '170px',
          aspectRatio: '1',
          transform: 'translate3d(0, 0, 20px)',
          boxShadow: 'rgba(100, 100, 111, 0.2) -10px 10px 20px 0px',
          backdropFilter: 'blur(5px)',
          background: 'rgba(0, 191, 191, 0.2)',
        }}
      />

      {/* Circle 2 */}
      <span 
        className="block absolute rounded-full transition-all duration-500"
        style={{
          width: '140px',
          aspectRatio: '1',
          top: '10px',
          right: '10px',
          transform: 'translate3d(0, 0, 40px)',
          boxShadow: 'rgba(100, 100, 111, 0.2) -10px 10px 20px 0px',
          backdropFilter: 'blur(1px)',
          background: 'rgba(0, 191, 191, 0.2)',
          transitionDelay: '0.4s',
        }}
      />

      {/* Circle 3 */}
      <span 
        className="block absolute rounded-full transition-all duration-500"
        style={{
          width: '110px',
          aspectRatio: '1',
          top: '17px',
          right: '17px',
          transform: 'translate3d(0, 0, 60px)',
          boxShadow: 'rgba(100, 100, 111, 0.2) -10px 10px 20px 0px',
          backdropFilter: 'blur(5px)',
          background: 'rgba(0, 191, 191, 0.2)',
          transitionDelay: '0.8s',
        }}
      />

      {/* Circle 4 */}
      <span 
        className="block absolute rounded-full transition-all duration-500"
        style={{
          width: '80px',
          aspectRatio: '1',
          top: '23px',
          right: '23px',
          transform: 'translate3d(0, 0, 80px)',
          boxShadow: 'rgba(100, 100, 111, 0.2) -10px 10px 20px 0px',
          backdropFilter: 'blur(5px)',
          background: 'rgba(0, 191, 191, 0.2)',
          transitionDelay: '1.2s',
        }}
      />

      {/* Circle 5 with logo */}
      <span 
        className="block absolute rounded-full transition-all duration-500 flex items-center justify-center"
        style={{
          width: '50px',
          aspectRatio: '1',
          top: '30px',
          right: '30px',
          transform: 'translate3d(0, 0, 100px)',
          boxShadow: 'rgba(100, 100, 111, 0.2) -10px 10px 20px 0px',
          backdropFilter: 'blur(5px)',
          background: 'rgba(0, 191, 191, 0.2)',
          transitionDelay: '1.6s',
        }}
      >
        <Image 
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
          alt="" 
          width={24} 
          height={24}
          className="object-contain"
        />
      </span>
    </>
  );
}