import { Building2, Package, Users, FileText, CheckCircle2 } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Building2,
      title: 'Gestion de Chantiers',
      description: 'Suivez tous vos projets de construction en temps réel avec un système de gestion complet et intuitif',
      color: 'from-primary/20 to-cyan-400/20',
      benefits: ['Suivi en temps réel', 'Documents centralisés', 'Albums photos/vidéos']
    },
    {
      icon: Package,
      title: 'Gestion du Stock',
      description: 'Gérez vos matériaux et matériels efficacement avec un système de traçabilité avancé',
      color: 'from-cyan-400/20 to-primary/20',
      benefits: ['Inventaire en temps réel', 'Historique des mouvements', 'Alertes de stock bas']
    },
    {
      icon: FileText,
      title: 'Documents & Factures',
      description: 'Centralisez tous vos documents importants : devis, factures, contrats et plans',
      color: 'from-primary/20 to-cyan-500/20',
      benefits: ['Stockage sécurisé', 'Accès rapide', 'Versionning automatique']
    },
    {
      icon: Users,
      title: 'Gestion d\'Équipe',
      description: 'Coordonnez vos équipes avec des rôles et permissions personnalisés',
      color: 'from-cyan-500/20 to-primary/20',
      benefits: ['Rôles personnalisés', 'Suivi d\'activité', 'Communication interne']
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Fonctionnalités Complètes
        </h2>
        <p className="text-zinc-400 text-lg">
          Tout ce dont vous avez besoin pour gérer votre entreprise
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-primary/50 transition-all duration-500 animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
