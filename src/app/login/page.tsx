'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Loader2, Lock, Mail, Hammer, Construction, Wrench, HardHat, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

// ✅ Force dynamic rendering to prevent pre-rendering errors
export const dynamic = 'force-dynamic';

// Animated background particles for construction theme
function ConstructionParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      type: string;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        type: Math.random() > 0.5 ? 'brick' : 'dust',
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.beginPath();
        if (particle.type === 'brick') {
          ctx.rect(particle.x, particle.y, particle.size * 2, particle.size);
          ctx.fillStyle = `rgba(0, 191, 191, ${particle.opacity})`;
        } else {
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 191, 191, ${particle.opacity * 0.6})`;
        }
        ctx.fill();

        particle.y += particle.speedY;

        if (particle.y < -10 || particle.y > canvas.height + 10) {
          particle.y = particle.y < 0 ? canvas.height : 0;
        }
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

// Floating construction icons
function FloatingConstructionIcons() {
  const icons = [
    { Icon: Hammer, delay: 0, left: '10%', top: '20%' },
    { Icon: Construction, delay: 1, left: '85%', top: '30%' },
    { Icon: Wrench, delay: 2, left: '15%', top: '70%' },
    { Icon: HardHat, delay: 1.5, left: '88%', top: '75%' },
  ];

  return (
    <>
      {icons.map(({ Icon, delay, left, top }, index) => (
        <div
          key={index}
          className="absolute opacity-10 pointer-events-none"
          style={{
            left,
            top,
            animation: `floatUp 4s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon className="w-16 h-16 text-primary" />
        </div>
      ))}
    </>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const router = useRouter();
  const { user, isLoading, signIn: authSignIn } = useAuth();

  // ✅ Check for error parameter in URL without useSearchParams (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      
      if (errorParam === 'account_disabled') {
        const errorMsg = 'Votre compte a été désactivé. Veuillez contacter un administrateur.';
        setError(errorMsg);
        toast.error('Compte désactivé', {
          description: 'Votre compte a été désactivé. Contactez un administrateur.',
          duration: 6000,
        });
        localStorage.removeItem('bearer_token');
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔵 [LOGIN] Attempting login with JWT auth...');
      
      const result = await authSignIn(email, password);

      if (!result.success || result.error) {
        console.log('🔴 [LOGIN] Error:', result.error);
        setError(result.error || 'Erreur de connexion');
        
        if (result.error?.includes('désactivé') || result.error?.includes('disabled')) {
          toast.error('Compte désactivé', {
            description: result.error,
            duration: 6000,
          });
        } else {
          toast.error(result.error || 'Erreur de connexion');
        }
        
        setLoading(false);
        return;
      }

      console.log('✅ [LOGIN] Login successful with JWT!');
      
      if (rememberMe) {
        localStorage.setItem('jhs_remember_email', email);
      } else {
        localStorage.removeItem('jhs_remember_email');
      }

      toast.success('Connexion réussie !');
      router.push('/dashboard');
    } catch (err) {
      console.error('🔴 [LOGIN] Exception:', err);
      setError('Erreur de connexion');
      toast.error('Erreur de connexion');
      setLoading(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('jhs_remember_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleQuickFill = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (emailInput) emailInput.focus();
    setTimeout(() => {
      if (passwordInput) passwordInput.focus();
    }, 100);
  };

  if (!isLoading && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <ConstructionParticles />
      <FloatingConstructionIcons />

      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
      
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 191, 191, .3) 25%, rgba(0, 191, 191, .3) 26%, transparent 27%, transparent 74%, rgba(0, 191, 191, .3) 75%, rgba(0, 191, 191, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 191, 191, .3) 25%, rgba(0, 191, 191, .3) 26%, transparent 27%, transparent 74%, rgba(0, 191, 191, .3) 75%, rgba(0, 191, 191, .3) 76%, transparent 77%, transparent)',
          backgroundSize: '60px 60px',
        }}
      />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700" style={{ animationDelay: '100ms' }}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-cyan-400/20 shadow-2xl shadow-primary/40 mb-5 animate-in zoom-in duration-700 p-4 backdrop-blur-xl border-2 border-primary/30 group hover:scale-110 transition-all duration-500 hover:shadow-primary/60" style={{ animationDelay: '200ms' }}>
            <div className="relative w-full h-full animate-float-up">
              <Image 
                src="https://lbrpgafneesnlqrckvvs.supabase.co/storage/v1/object/public/company-assets/logos/jhs-logo.png" 
                alt="JHS Logo" 
                width={48} 
                height={48}
                className="object-contain group-hover:rotate-6 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-primary bg-clip-text text-transparent">
              JHS ENTREPRISE
            </span>
          </h1>
          <p className="text-zinc-400 text-sm font-medium flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Intranet Sécurisé
          </p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border-2 border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:border-white/20 transition-all duration-500 relative overflow-hidden" style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-semibold flex items-center gap-2">
                <Mail className={`w-4 h-4 transition-all duration-300 ${focusedInput === 'email' ? 'text-primary scale-110' : 'text-primary/70'}`} />
                Email
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@jhs.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  disabled={loading}
                  className="h-12 bg-white/5 border-white/20 text-white placeholder:text-zinc-500 focus:bg-white/10 focus:border-primary/60 transition-all duration-300 rounded-xl backdrop-blur-sm hover:bg-white/8 group-hover:border-white/30"
                />
                {focusedInput === 'email' && (
                  <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl pointer-events-none animate-pulse" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-semibold flex items-center gap-2">
                <Lock className={`w-4 h-4 transition-all duration-300 ${focusedInput === 'password' ? 'text-primary scale-110' : 'text-primary/70'}`} />
                Mot de passe
              </Label>
              <div className="relative group">
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  disabled={loading}
                  className="h-12 bg-white/5 border-white/20 text-white placeholder:text-zinc-500 focus:bg-white/10 focus:border-primary/60 transition-all duration-300 rounded-xl backdrop-blur-sm hover:bg-white/8 group-hover:border-white/30"
                />
                {focusedInput === 'password' && (
                  <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl pointer-events-none animate-pulse" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-zinc-400 cursor-pointer hover:text-white transition-colors">
                Se souvenir de moi
              </label>
            </div>

            {error && (
              <div className={`${
                error.includes('désactivé') || error.includes('disabled')
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              } border px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm flex items-start gap-3`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">
                    {error.includes('désactivé') || error.includes('disabled') 
                      ? 'Compte désactivé' 
                      : 'Erreur de connexion'}
                  </p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary via-primary to-cyan-400 hover:from-primary/90 hover:via-primary/90 hover:to-cyan-400/90 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 rounded-xl group relative overflow-hidden"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-6 bg-zinc-900/60 backdrop-blur-3xl rounded-2xl p-6 border-2 border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl hover:border-white/20 transition-all duration-500" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-white font-bold text-sm">Comptes de test</p>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { role: 'Admin', email: 'admin@jhs.fr', password: 'admin123', color: 'from-primary/20 to-cyan-400/10' },
              { role: 'Travailleur', email: 'jean.martin@jhs.fr', password: 'jean123', color: 'from-cyan-400/20 to-primary/10' },
              { role: 'Client', email: 'pierre.bernard@gmail.com', password: 'client123', color: 'from-primary/15 to-cyan-400/15' },
            ].map((account, index) => (
              <button
                key={account.email}
                onClick={() => handleQuickFill(account.email, account.password)}
                className={`w-full flex items-center justify-between py-3 px-4 bg-gradient-to-r ${account.color} rounded-xl hover:scale-[1.02] transition-all duration-300 group border border-white/10 hover:border-primary/40 cursor-pointer`}
                style={{ animationDelay: `${500 + index * 50}ms` }}
              >
                <span className="text-zinc-400 font-semibold group-hover:text-white transition-colors">{account.role}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 group-hover:text-white transition-colors font-medium">{account.email}</span>
                  <ChevronRight className="w-4 h-4 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}