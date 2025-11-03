import { Building2, Users, Clock, Shield } from 'lucide-react';

export function StatsSection() {
  const stats = [
    { icon: Building2, value: '500+', label: 'Chantiers gérés', color: 'text-primary' },
    { icon: Users, value: '5+', label: 'Professionnels actifs', color: 'text-cyan-400' },
    { icon: Clock, value: '24/7', label: 'Disponibilité', color: 'text-primary' },
    { icon: Shield, value: '100%', label: 'Sécurisé', color: 'text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800 hover:border-primary/50 transition-all duration-300 text-center animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} aria-hidden="true" />
            <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
            <div className="text-sm text-zinc-400">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
