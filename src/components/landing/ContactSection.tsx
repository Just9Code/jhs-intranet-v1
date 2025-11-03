import { Phone, Mail, MapPin } from 'lucide-react';

export function ContactSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-gradient-to-br from-primary/10 to-cyan-400/10 rounded-3xl p-8 sm:p-12 border border-primary/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Contactez-nous
          </h2>
          <p className="text-zinc-300 text-lg">
            Une question ? Notre équipe est là pour vous aider
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <a 
            href="tel:0491631313" 
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-all duration-300 group"
            aria-label="Appeler le 04 91 63 13 13"
          >
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="text-center">
              <div className="text-sm text-zinc-400 mb-1">Téléphone</div>
              <div className="font-semibold text-white">04 91 63 13 13</div>
            </div>
          </a>

          <a 
            href="mailto:contact@jhsentreprise.fr" 
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-all duration-300 group"
            aria-label="Envoyer un email à contact@jhsentreprise.fr"
          >
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="text-center">
              <div className="text-sm text-zinc-400 mb-1">Email</div>
              <div className="font-semibold text-white text-sm">contact@jhsentreprise.fr</div>
            </div>
          </a>

          <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="text-center">
              <div className="text-sm text-zinc-400 mb-1">Localisation</div>
              <div className="font-semibold text-white">Marseille | Barrême, France</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
