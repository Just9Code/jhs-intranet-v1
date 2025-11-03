import { Target, Shield, Zap, Users } from 'lucide-react';

export function ValuesSection() {
  const companyValues = [
    { icon: Target, title: 'Excellence', description: 'Nous visons l\'excellence dans chaque projet' },
    { icon: Shield, title: 'Fiabilité', description: 'Une infrastructure sécurisée et stable' },
    { icon: Zap, title: 'Rapidité', description: 'Des outils performants pour gagner du temps' },
    { icon: Users, title: 'Collaboration', description: 'Une plateforme pensée pour le travail d\'équipe' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-zinc-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Nos Valeurs
          </h2>
          <p className="text-zinc-400 text-lg">
            Ce qui nous définit et guide notre travail au quotidien
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {companyValues.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="text-center p-6 rounded-xl bg-zinc-800/30 border border-zinc-700 hover:border-primary/40 transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex p-4 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-zinc-400">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
