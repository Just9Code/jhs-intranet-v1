'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Filter, RefreshCw, AlertCircle, Eye, Calendar, User, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  resourceType: string;
  resourceId: number | null;
  ipAddress: string;
  userAgent: string;
  details: string | null;
  createdAt: string;
}

// Animated Background (same as factures page)
function AnimatedBackground() {
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
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 191, 191, ${particle.opacity})`;
        ctx.fill();

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
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

export default function AuditLogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filters
  const [searchUserId, setSearchUserId] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast.error('Accès interdit - Réservé aux administrateurs');
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isDetailsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDetailsOpen]);

  // Fetch logs
  const fetchLogs = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchUserId) params.append('userId', searchUserId);
      if (filterAction) params.append('action', filterAction);
      if (filterResource) params.append('resourceType', filterResource);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erreur lors du chargement des logs d\'audit');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchLogs();
    }
  }, [user, page, searchUserId, filterAction, filterResource]);

  const handleReset = () => {
    setSearchUserId('');
    setFilterAction('');
    setFilterResource('');
    setPage(1);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('CREATE')) return 'default';
    if (action.includes('FAILED') || action.includes('DELETE') || action.includes('DENIED')) return 'destructive';
    if (action.includes('UPDATE') || action.includes('DISABLE')) return 'secondary';
    return 'outline';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="flex">
        <CollapsibleSidebar />
        
        <main className="flex-1 relative overflow-hidden">
          {/* Animated Background - same as factures */}
          <AnimatedBackground />

          {/* Gradient Orbs with mouse parallax - same as factures */}
          <div 
            className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl animate-pulse pointer-events-none"
            style={{ 
              animationDuration: '4s',
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse pointer-events-none"
            style={{ 
              animationDuration: '6s', 
              animationDelay: '1s',
              transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />

          {/* Grid pattern overlay - same as factures */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 191, 191, .3) 25%, rgba(0, 191, 191, .3) 26%, transparent 27%, transparent 74%, rgba(0, 191, 191, .3) 75%, rgba(0, 191, 191, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 191, 191, .3) 25%, rgba(0, 191, 191, .3) 26%, transparent 27%, transparent 74%, rgba(0, 191, 191, .3) 75%, rgba(0, 191, 191, .3) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px',
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
            {/* Header with glassmorphism */}
            <div className="mb-6 sm:mb-8 bg-zinc-900/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-4">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-500/30 backdrop-blur-sm border border-primary/40 shadow-lg shadow-primary/20">
                  <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Audit Logs
                  </h1>
                  <p className="text-white/60 mt-1 text-base sm:text-lg">
                    Journal de toutes les actions effectuées sur la plateforme
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Filtres</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    type="number"
                    placeholder="ID Utilisateur..."
                    value={searchUserId}
                    onChange={(e) => {
                      setSearchUserId(e.target.value);
                      setPage(1);
                    }}
                    className="pl-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-primary/50 h-12 text-base rounded-xl backdrop-blur-sm"
                  />
                </div>

                <Select value={filterAction} onValueChange={(value) => {
                  setFilterAction(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white h-12 text-base rounded-xl backdrop-blur-sm focus:border-primary/50">
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">Connexion réussie</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Connexion échouée</SelectItem>
                    <SelectItem value="CREATE_USER">Création utilisateur</SelectItem>
                    <SelectItem value="UPDATE_USER">Modification utilisateur</SelectItem>
                    <SelectItem value="DELETE_USER">Suppression utilisateur</SelectItem>
                    <SelectItem value="CREATE_CHANTIER">Création chantier</SelectItem>
                    <SelectItem value="DELETE_CHANTIER">Suppression chantier</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterResource} onValueChange={(value) => {
                  setFilterResource(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white h-12 text-base rounded-xl backdrop-blur-sm focus:border-primary/50">
                    <SelectValue placeholder="Toutes les ressources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les ressources</SelectItem>
                    <SelectItem value="auth">Authentification</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="chantier">Chantier</SelectItem>
                    <SelectItem value="stock_materiau">Stock Matériau</SelectItem>
                    <SelectItem value="stock_materiel">Stock Matériel</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleReset}
                  className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-primary/50 h-12 text-base rounded-xl backdrop-blur-sm transition-all hover:scale-105"
                >
                  <RefreshCw className="h-5 w-5" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
              <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Total Logs</p>
                    <p className="text-3xl font-black text-white">{total}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 backdrop-blur-sm border border-primary/30">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Page actuelle</p>
                    <p className="text-3xl font-black text-white">{page}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 backdrop-blur-sm border border-cyan-500/30">
                    <AlertCircle className="h-7 w-7 text-cyan-400" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Logs affichés</p>
                    <p className="text-3xl font-black text-white">{logs.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-sm border border-orange-500/30">
                    <Activity className="h-7 w-7 text-orange-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Logs - Cards for mobile, Table for desktop */}
            <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Historique des logs</h2>
                <p className="text-white/60 text-sm mt-1">{total} entrée(s) au total</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="p-6 rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20 w-fit mx-auto mb-6">
                    <AlertCircle className="h-16 w-16 text-primary/60 mx-auto" />
                  </div>
                  <p className="text-xl font-semibold text-white/70 mb-2">Aucun log trouvé</p>
                  <p className="text-white/50">Essayez de modifier vos filtres</p>
                </div>
              ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="lg:hidden space-y-4">
                    {logs.map((log, index) => {
                      const details = parseDetails(log.details);
                      return (
                        <div
                          key={log.id}
                          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${400 + index * 30}ms` }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                                  {log.action}
                                </Badge>
                                {log.userName ? (
                                  <Badge className="text-xs bg-white text-zinc-900 hover:bg-white/90 font-semibold">
                                    {log.userName}
                                  </Badge>
                                ) : log.userId ? (
                                  <Badge className="font-mono text-xs bg-white/20 text-white hover:bg-white/30">
                                    User #{log.userId}
                                  </Badge>
                                ) : null}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {log.resourceType}
                                {log.resourceId && ` #${log.resourceId}`}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                              className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-xl h-9 px-3"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-white">
                              <Calendar className="h-4 w-4 text-white/40" />
                              <span>{formatDate(log.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white font-mono text-xs">
                              <span className="text-white/40">IP:</span>
                              <span>{log.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-white/70 font-semibold">Date</TableHead>
                          <TableHead className="text-white/70 font-semibold">Utilisateur</TableHead>
                          <TableHead className="text-white/70 font-semibold">Action</TableHead>
                          <TableHead className="text-white/70 font-semibold">Ressource</TableHead>
                          <TableHead className="text-white/70 font-semibold">IP</TableHead>
                          <TableHead className="text-white/70 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white text-sm">
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              {log.userName ? (
                                <Badge className="bg-white text-zinc-900 hover:bg-white/90 font-semibold">
                                  {log.userName}
                                </Badge>
                              ) : log.userId ? (
                                <Badge className="font-mono bg-white/20 text-white hover:bg-white/30">
                                  User #{log.userId}
                                </Badge>
                              ) : (
                                <span className="text-white/40 text-sm">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.action)}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {log.resourceType}
                                {log.resourceId && ` #${log.resourceId}`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white text-sm font-mono">
                              {log.ipAddress}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleViewDetails(log)}
                                className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-xl h-9"
                              >
                                <Eye className="h-4 w-4" />
                                Détails
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Pagination */}
              {!isLoading && total > limit && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
                  <p className="text-sm text-white/60">
                    Affichage de {(page - 1) * limit + 1} à {Math.min(page * limit, total)} sur {total} entrées
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-primary/50 h-10 rounded-xl disabled:opacity-40"
                    >
                      Précédent
                    </Button>
                    <Button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * limit >= total}
                      className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 h-10 rounded-xl disabled:opacity-40"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Dialog with glassmorphism and FIXED SCROLL */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] bg-zinc-900/98 backdrop-blur-3xl border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col">
              <DialogHeader className="pb-4 border-b border-white/10 shrink-0">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  Détails du log
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Informations complètes sur l'action effectuée
                </DialogDescription>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 pr-2 -mr-2">
                {selectedLog && (
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-white/60 text-xs mb-2 font-medium">Date & Heure</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-white font-semibold">{formatDate(selectedLog.createdAt)}</p>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-white/60 text-xs mb-2 font-medium">Utilisateur</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-cyan-400" />
                          {selectedLog.userName ? (
                            <Badge className="bg-white text-zinc-900 hover:bg-white/90 font-semibold">
                              {selectedLog.userName}
                            </Badge>
                          ) : selectedLog.userId ? (
                            <Badge className="font-mono bg-white/20 text-white hover:bg-white/30">
                              User #{selectedLog.userId}
                            </Badge>
                          ) : (
                            <span className="text-white/40">N/A</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-white/60 text-xs mb-2 font-medium">Action</p>
                        <Badge variant={getActionBadgeVariant(selectedLog.action)} className="text-sm">
                          {selectedLog.action}
                        </Badge>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-white/60 text-xs mb-2 font-medium">Ressource</p>
                        <Badge variant="secondary" className="text-sm">
                          {selectedLog.resourceType}
                          {selectedLog.resourceId && ` #${selectedLog.resourceId}`}
                        </Badge>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 sm:col-span-2">
                        <p className="text-white/60 text-xs mb-2 font-medium">Adresse IP</p>
                        <p className="text-white font-mono text-base">{selectedLog.ipAddress}</p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 sm:col-span-2">
                        <p className="text-white/60 text-xs mb-2 font-medium">User Agent</p>
                        <p className="text-white text-sm break-all">{selectedLog.userAgent}</p>
                      </div>
                    </div>

                    {selectedLog.details && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-white/60 text-xs mb-3 font-medium">Détails supplémentaires</p>
                        <div className="bg-zinc-950/50 rounded-lg p-4 border border-white/5">
                          <pre className="text-white text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                            {typeof parseDetails(selectedLog.details) === 'object' 
                              ? JSON.stringify(parseDetails(selectedLog.details), null, 2)
                              : selectedLog.details}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}