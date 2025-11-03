'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Users, 
  FileText,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Wrench,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { useCompleteUser } from '@/hooks/useCompleteUser';
import Image from 'next/image';

interface Stats {
  chantiers: number;
  stockMateriaux: number;
  stockMateriels: number;
  users: number;
  files: number;
  movements: number;
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    chantiers: 0,
    stockMateriaux: 0,
    stockMateriels: 0,
    users: 0,
    files: 0,
    movements: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useCompleteUser();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('jhs_token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Base API calls for all users
        const apiCalls = [
          fetch('/api/chantiers?limit=1000', { headers }).then(r => r.json()),
          fetch('/api/stock-materiaux?limit=1000', { headers }).then(r => r.json()),
          fetch('/api/stock-materiels?limit=1000', { headers }).then(r => r.json()),
          fetch('/api/chantier-files?limit=1000', { headers }).then(r => r.json()),
          fetch('/api/stock-movements?limit=1000', { headers }).then(r => r.json()),
        ];

        // Only fetch users if current user is admin
        if (user?.role === 'admin') {
          apiCalls.push(fetch('/api/users?limit=1000', { headers }).then(r => r.json()));
        }

        const results = await Promise.all(apiCalls);

        const [chantiers, materiaux, materiels, files, movements, users] = results;

        const activeChantiers = chantiers.filter((c: any) => 
          c.status === 'en_attente' || c.status === 'en_cours'
        );

        setStats({
          chantiers: activeChantiers.length,
          stockMateriaux: materiaux.length,
          stockMateriels: materiels.length,
          users: users ? users.length : 0,
          files: files.length,
          movements: movements.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const statCards = [
    {
      title: 'Projets actifs',
      value: stats.chantiers,
      icon: Building2,
      description: 'Chantiers en cours',
      gradient: 'from-primary/30 to-cyan-400/30',
      roles: ['admin', 'travailleur', 'client'],
    },
    {
      title: 'Ressources',
      value: stats.stockMateriaux,
      icon: Package,
      description: 'Matériaux disponibles',
      gradient: 'from-orange-500/30 to-amber-400/30',
      roles: ['admin', 'travailleur'],
    },
    {
      title: 'Équipements',
      value: stats.stockMateriels,
      icon: Wrench,
      description: 'Matériel disponible',
      gradient: 'from-blue-500/30 to-indigo-400/30',
      roles: ['admin', 'travailleur'],
    },
    {
      title: 'Équipe',
      value: stats.users,
      icon: Users,
      description: 'Membres actifs',
      gradient: 'from-purple-500/30 to-pink-400/30',
      roles: ['admin'],
    },
    {
      title: 'Documents',
      value: stats.files,
      icon: FileText,
      description: 'Fichiers disponibles',
      gradient: 'from-green-500/30 to-emerald-400/30',
      roles: ['admin', 'travailleur', 'client'],
    },
    {
      title: 'Activité récente',
      value: stats.movements,
      icon: TrendingUp,
      description: 'Opérations effectuées',
      gradient: 'from-red-500/30 to-rose-400/30',
      roles: ['admin', 'travailleur'],
    },
  ];

  const quickActions = [
    {
      title: 'Nouveau projet',
      description: 'Créer un chantier',
      icon: Plus,
      href: '/chantiers',
      roles: ['admin', 'travailleur'],
    },
    {
      title: 'Factures & Devis',
      description: 'Gérer les documents',
      icon: FileText,
      href: '/factures',
      roles: ['admin', 'travailleur'],
    },
    {
      title: 'Gérer les ressources',
      description: 'Matériaux et équipements',
      icon: Package,
      href: '/stock',
      roles: ['admin', 'travailleur'],
    },
    {
      title: 'Mes projets',
      description: 'Voir mes chantiers',
      icon: Building2,
      href: '/chantiers',
      roles: ['client'],
    },
    {
      title: 'Gestion d\'équipe',
      description: 'Collaborateurs',
      icon: Users,
      href: '/users',
      roles: ['admin'],
    },
  ];

  const filteredStats = statCards.filter(card => 
    user && card.roles.includes(user.role)
  );

  const filteredActions = quickActions.filter(action => 
    user && action.roles.includes(user.role)
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden animate-in fade-in duration-700">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/15 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />

        <div className="flex relative z-10">
          <CollapsibleSidebar />
          
          <main className="flex-1 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Welcome Header */}
            <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/40 to-cyan-400/40 backdrop-blur-sm border border-primary/50 shadow-xl shadow-primary/30">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white">
                    Tableau de bord
                  </h1>
                  <p className="text-white/70 mt-1 text-base sm:text-lg">
                    Bienvenue, <span className="font-bold text-primary">{user?.name}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
              {filteredStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="group relative bg-zinc-900/50 backdrop-blur-2xl rounded-3xl p-6 border border-primary/20 shadow-2xl hover:bg-zinc-800/60 hover:border-primary/40 hover:shadow-primary/30 transition-all duration-500 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${200 + index * 100}ms` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
                            {stat.title}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white group-hover:text-primary transition-colors duration-300">
                              {loading ? (
                                <div className="h-14 w-20 bg-white/10 animate-pulse rounded-xl" />
                              ) : (
                                <AnimatedCounter value={stat.value} duration={2000} />
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mt-2 font-medium">{stat.description}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-400/30 backdrop-blur-sm border border-primary/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl shadow-primary/20">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                      </div>
                      
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: loading ? '0%' : '100%',
                            transitionDelay: `${300 + index * 100}ms`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '800ms' }}>
              <div className="flex items-center gap-3 mb-5 px-1">
                <div className="p-2.5 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white">Accès rapide</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} href={action.href}>
                      <div
                        className="bg-zinc-900/50 backdrop-blur-2xl rounded-2xl p-5 border border-primary/20 shadow-2xl hover:bg-zinc-800/60 hover:border-primary/40 hover:scale-105 hover:shadow-primary/30 transition-all duration-300 cursor-pointer group"
                        style={{ 
                          animationDelay: `${900 + index * 100}ms`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/40 to-cyan-400/40 backdrop-blur-sm border border-primary/50 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">
                                {action.title}
                              </h3>
                              <p className="text-sm text-white/60 mt-1">{action.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-primary/30 via-cyan-400/20 to-primary/30 backdrop-blur-2xl rounded-3xl p-6 border-2 border-primary/40 shadow-2xl shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '1100ms' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/40 backdrop-blur-sm border border-primary/50 shadow-xl">
                  <Image 
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
                    alt="JHS Logo" 
                    width={36} 
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Plateforme de gestion JHS ENTREPRISE
                  </h3>
                  <p className="text-white/80 text-base leading-relaxed">
                    Optimisez le suivi de vos projets et la coordination de vos équipes.
                    {user?.role === 'client' && ' Suivez l\'évolution de vos chantiers et consultez vos documents en temps réel.'}
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}