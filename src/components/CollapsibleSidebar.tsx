'use client';

import { useCompleteUser } from '@/hooks/useCompleteUser';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  LayoutDashboard, 
  Package, 
  Users,
  ChevronLeft,
  Sparkles,
  Building2,
  FileText,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function CollapsibleSidebar() {
  const { user, isLoading } = useCompleteUser();
  const router = useRouter();
  const pathname = usePathname();
  const { signOut: authSignOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) return saved === 'true';
      return window.innerWidth < 768;
    }
    return true;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }
  }, [isCollapsed, mounted]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      console.log('🔴 [LOGOUT] Starting logout with JWT auth...');
      
      const result = await authSignOut();
      
      if (result.error) {
        console.error('🔴 [LOGOUT] Error:', result.error);
        toast.error('Erreur lors de la déconnexion');
      } else {
        console.log('✅ [LOGOUT] Logout successful');
        toast.success('Déconnexion réussie');
        router.push('/');
      }
    } catch (error) {
      console.error('🔴 [LOGOUT] Exception:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'travailleur', 'client'] },
    { href: '/chantiers', label: 'Chantiers', icon: Building2, roles: ['admin', 'travailleur', 'client'] },
    { href: '/factures', label: 'Factures & Devis', icon: FileText, roles: ['admin', 'travailleur'] },
    { href: '/stock', label: 'Stock', icon: Package, roles: ['admin', 'travailleur'] },
    { href: '/users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
    { href: '/audit-logs', label: 'Audit Logs', icon: Shield, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  if (!mounted) {
    return (
      <>
        <aside className="fixed left-0 top-0 h-screen z-50 w-16 bg-white/10 backdrop-blur-2xl border-r border-white/10 shadow-2xl" />
        <div className="w-16" />
      </>
    );
  }

  return (
    <>
      <aside 
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-500 ease-out ${
          isCollapsed 
            ? 'w-16' 
            : 'w-64'
        } bg-white/10 backdrop-blur-2xl border-r border-white/10 shadow-2xl`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        
        <div className="flex flex-col h-full relative z-10">
          {/* Header with logo */}
          <div className={`flex items-center justify-between border-b border-white/10 transition-all duration-300 ${
            isCollapsed ? 'px-3 py-4' : 'px-5 py-5'
          }`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg group-hover:scale-110 transition-transform">
                  <Image 
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
                    alt="JHS Logo" 
                    width={20} 
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-white font-bold text-lg tracking-tight">JHS</span>
                  <p className="text-white/50 text-xs font-medium mt-0.5">ENTREPRISE</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="mx-auto p-2 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg animate-in zoom-in duration-300">
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/JHS-LOGO-BLEU-SANS-FOND-1761855434873.png" 
                  alt="JHS Logo" 
                  width={20} 
                  height={20}
                  className="object-contain"
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={`absolute -right-3 top-6 h-6 w-6 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-primary hover:border-primary hover:scale-110 shadow-lg transition-all duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-5 px-2.5">
            <div className="space-y-1.5">
              {filteredNavItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                        isCollapsed ? 'justify-center py-3.5 px-3' : 'px-3.5 py-3'
                      } ${
                        isActive 
                          ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105' 
                          : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-105 hover:shadow-lg'
                      }`}
                      style={{
                        animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
                      }}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent animate-shimmer" />
                      )}
                      
                      <div className={`relative z-10 ${isActive ? 'animate-bounce-slow' : ''}`}>
                        <Icon className={`flex-shrink-0 transition-all duration-300 ${
                          isCollapsed ? 'h-5 w-5' : 'h-5 w-5'
                        } ${isActive ? 'drop-shadow-lg' : 'group-hover:scale-110'}`} />
                      </div>
                      
                      {!isCollapsed && (
                        <span className="relative z-10 text-sm font-semibold whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                          {item.label}
                        </span>
                      )}
                      
                      {isActive && !isCollapsed && (
                        <div className="ml-auto relative z-10">
                          <Sparkles className="h-4 w-4 text-white/80 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-white/10 backdrop-blur-xl">
            {!isCollapsed && user && (
              <div className="px-4 py-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-primary font-bold text-base">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-primary text-xs capitalize font-medium mt-0.5 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isCollapsed && user && (
              <div className="px-3 py-3.5 flex justify-center animate-in zoom-in duration-300">
                <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className={isCollapsed ? 'p-2.5' : 'px-4 pb-4'}>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className={`w-full bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-destructive/20 hover:border-destructive hover:text-destructive hover:scale-105 transition-all duration-300 rounded-xl group ${
                  isCollapsed ? 'justify-center px-2.5 h-10' : 'justify-start h-10'
                }`}
              >
                <LogOut className={`flex-shrink-0 transition-all duration-300 group-hover:rotate-12 ${
                  isCollapsed ? 'h-4.5 w-4.5' : 'h-4 w-4'
                }`} />
                {!isCollapsed && <span className="ml-2.5 text-sm font-semibold">Déconnexion</span>}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-500 ${isCollapsed ? 'w-16' : 'w-64'}`} />
    </>
  );
}