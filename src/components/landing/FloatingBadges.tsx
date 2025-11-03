import { Hammer, Ruler, Shield, Zap } from 'lucide-react';

export function FloatingBadges() {
  const badges = [
    { Icon: Hammer, label: 'Construction', delay: 0 },
    { Icon: Ruler, label: 'Précision', delay: 0.2 },
    { Icon: Shield, label: 'Sécurisé', delay: 0.4 },
    { Icon: Zap, label: 'Rapide', delay: 0.6 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {badges.map(({ Icon, label, delay }, index) => (
        <div
          key={index}
          className="absolute opacity-10"
          style={{
            top: `${15 + index * 22}%`,
            right: `${5 + index * 8}%`,
            animation: `floatGentle ${3 + index * 0.5}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <div className="flex items-center gap-2 text-primary">
            <Icon className="w-8 h-8" />
            <span className="text-sm font-bold">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
