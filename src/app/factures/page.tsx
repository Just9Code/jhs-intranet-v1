'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCompleteUser } from '@/hooks/useCompleteUser';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileCheck,
  FilePlus,
  Loader2,
  X,
} from 'lucide-react';
import { InvoiceEditor } from '@/components/invoice-editor';
import { toast } from 'sonner';

// Animated Background Particles (same as homepage)
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

interface InvoiceQuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceQuote {
  id: number;
  type: 'invoice' | 'quote';
  documentNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;
  chantierId?: number;
  issueDate: string;
  dueDate?: string;
  validityDate?: string;
  status: string;
  items: InvoiceQuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export default function FacturesPage() {
  const { user, isLoading: authLoading } = useCompleteUser();
  const router = useRouter();
  const [documents, setDocuments] = useState<InvoiceQuote[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<InvoiceQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'invoice' | 'quote'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<InvoiceQuote | null>(null);
  const [initialType, setInitialType] = useState<'invoice' | 'quote' | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<InvoiceQuote | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/invoices-quotes?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      
      // Parse items from JSON string
      const parsedData = data.map((doc: any) => ({
        ...doc,
        items: typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items,
      }));
      
      setDocuments(parsedData);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.documentNumber.toLowerCase().includes(term) ||
          doc.clientName.toLowerCase().includes(term) ||
          doc.clientEmail.toLowerCase().includes(term)
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleCreateNew = (type: 'invoice' | 'quote') => {
    setSelectedDocument(null);
    setIsViewMode(false);
    setIsEditorOpen(true);
    setInitialType(type);
  };

  const handleView = (document: InvoiceQuote) => {
    setSelectedDocument(document);
    setIsViewMode(true);
    setIsEditorOpen(true);
  };

  const handleEdit = (document: InvoiceQuote) => {
    setSelectedDocument(document);
    setIsViewMode(false);
    setIsEditorOpen(true);
  };

  const handleDelete = (document: InvoiceQuote) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/invoices-quotes?id=${documentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete document');

      toast.success(
        `${documentToDelete.type === 'invoice' ? 'Facture' : 'Devis'} supprimé avec succès`
      );
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedDocument(null);
    setIsViewMode(false);
    fetchDocuments();
  };

  const getStatusBadge = (status: string, type: string) => {
    const statusConfig = {
      invoice: {
        draft: { label: 'Brouillon', className: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' },
        sent: { label: 'Envoyée', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
        paid: { label: 'Payée', className: 'bg-green-500/20 text-green-300 border border-green-500/30' },
        cancelled: { label: 'Annulée', className: 'bg-red-500/20 text-red-300 border border-red-500/30' },
      },
      quote: {
        draft: { label: 'Brouillon', className: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' },
        sent: { label: 'Envoyé', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
        accepted: { label: 'Accepté', className: 'bg-green-500/20 text-green-300 border border-green-500/30' },
        rejected: { label: 'Rejeté', className: 'bg-red-500/20 text-red-300 border border-red-500/30' },
      },
    };

    const typeConfig = statusConfig[type as 'invoice' | 'quote'];
    if (!typeConfig) return null;
    
    const config = typeConfig[status as keyof typeof typeConfig];
    if (!config) return null;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden">
        {/* Animated Background - same as homepage */}
        <AnimatedBackground />

        {/* Gradient Orbs with mouse parallax - same as homepage */}
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

        {/* Grid pattern overlay - same as homepage */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 191, 191, .3) 25%, rgba(0, 191, 191, .3) 26%, transparent 27%, transparent 74%, rgba(0, 191, 191, .3) 75%, rgba(0, 191, 191, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 191, 191, .3) 25%, rgba(0, 191, 191, .3) 26%, transparent 27%, transparent 74%, rgba(0, 191, 191, .3) 75%, rgba(0, 191, 191, .3) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="flex relative z-10">
          <CollapsibleSidebar />
          
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header with glassmorphism - improved */}
            <div className="mb-6 sm:mb-8 bg-zinc-900/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-4">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-500/30 backdrop-blur-sm border border-primary/40 shadow-lg shadow-primary/20">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Factures & Devis
                  </h1>
                  <p className="text-white/60 mt-1 text-base sm:text-lg">
                    Gérez vos factures et devis en toute simplicité
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - much more visible with homepage styles */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
              <Button
                onClick={() => handleCreateNew('invoice')}
                size="lg"
                className="gap-3 group rounded-2xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary via-cyan-500 to-primary bg-[length:200%_100%] hover:bg-right border border-primary/50 font-semibold text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
              >
                <FilePlus className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform" />
                Nouvelle Facture
              </Button>
              <Button
                onClick={() => handleCreateNew('quote')}
                size="lg"
                className="gap-3 group rounded-2xl shadow-xl hover:shadow-2xl border-2 border-white/20 hover:border-primary/50 text-white hover:bg-white/15 hover:scale-105 transition-all duration-300 font-semibold text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 bg-white/10 backdrop-blur-xl"
              >
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
                Nouveau Devis
              </Button>
            </div>

            {/* Filters with improved glassmorphism */}
            <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Filtres</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-primary/50 h-12 text-base rounded-xl backdrop-blur-sm"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white h-12 text-base rounded-xl backdrop-blur-sm focus:border-primary/50">
                    <SelectValue placeholder="Type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="invoice">Factures</SelectItem>
                    <SelectItem value="quote">Devis</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white h-12 text-base rounded-xl backdrop-blur-sm focus:border-primary/50">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="sent">Envoyé</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="accepted">Accepté</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                      setStatusFilter('all');
                    }}
                    className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-primary/50 h-12 text-base rounded-xl backdrop-blur-sm transition-all hover:scale-105"
                  >
                    <X className="h-5 w-5" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>

            {/* Documents List - improved cards */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 sm:p-16 text-center shadow-2xl">
                  <div className="p-6 rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20 w-fit mx-auto mb-6">
                    <FileText className="h-16 w-16 text-primary/60 mx-auto" />
                  </div>
                  <p className="text-xl sm:text-2xl font-semibold text-white/70 mb-3">Aucun document trouvé</p>
                  <p className="text-base text-white/50">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'Essayez de modifier vos filtres'
                      : 'Créez votre premier document'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5">
                  {filteredDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="bg-zinc-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 hover:bg-zinc-800/50 hover:border-primary/30 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${400 + index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-4 mb-5">
                            <div className={`p-3 rounded-xl backdrop-blur-sm border shadow-lg ${doc.type === 'invoice' ? 'bg-gradient-to-br from-primary/30 to-cyan-500/30 border-primary/40 shadow-primary/20' : 'bg-gradient-to-br from-cyan-500/30 to-teal-500/30 border-cyan-500/40 shadow-cyan-500/20'} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                              {doc.type === 'invoice' ? (
                                <FilePlus className="h-7 w-7 text-primary" />
                              ) : (
                                <FileCheck className="h-7 w-7 text-cyan-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-primary transition-colors">{doc.documentNumber}</h3>
                                {getStatusBadge(doc.status, doc.type)}
                              </div>
                              <p className="text-base text-white/60">{doc.clientName}</p>
                              <p className="text-sm text-white/40">{doc.clientEmail}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                              <p className="text-white/50 text-xs mb-1 font-medium">Date d'émission</p>
                              <p className="font-semibold text-white text-base">{formatDate(doc.issueDate)}</p>
                            </div>
                            {doc.dueDate && (
                              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-white/50 text-xs mb-1 font-medium">Date d'échéance</p>
                                <p className="font-semibold text-white text-base">{formatDate(doc.dueDate)}</p>
                              </div>
                            )}
                            {doc.validityDate && (
                              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-white/50 text-xs mb-1 font-medium">Validité</p>
                                <p className="font-semibold text-white text-base">{formatDate(doc.validityDate)}</p>
                              </div>
                            )}
                            <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 backdrop-blur-sm rounded-xl p-4 border border-primary/30 col-span-2 lg:col-span-1">
                              <p className="text-primary/70 text-xs mb-1 font-medium">Montant total</p>
                              <p className="font-black text-primary text-xl">{formatCurrency(doc.totalAmount)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto sm:flex-col">
                          <Button
                            size="lg"
                            onClick={() => handleView(doc)}
                            className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-primary/20 to-cyan-500/20 backdrop-blur-sm border border-primary/40 text-white hover:from-primary/30 hover:to-cyan-500/30 hover:scale-110 hover:shadow-lg hover:shadow-primary/30 transition-all h-11 rounded-xl font-semibold"
                            title="Visualiser"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Voir</span>
                          </Button>
                          <Button
                            size="lg"
                            onClick={() => handleEdit(doc)}
                            className="flex-1 sm:flex-none gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-cyan-500/20 hover:border-cyan-500 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30 transition-all h-11 rounded-xl font-semibold"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Éditer</span>
                          </Button>
                          <Button
                            size="lg"
                            onClick={() => handleDelete(doc)}
                            className="flex-1 sm:flex-none gap-2 bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500 hover:text-red-200 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 transition-all h-11 rounded-xl font-semibold px-3 sm:px-4"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Supprimer</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-[98vw] xl:max-w-[2400px] max-h-[96vh] overflow-y-auto bg-zinc-900/95 backdrop-blur-2xl border-white/20 p-4 lg:p-8 xl:p-10">
          <DialogHeader className="mb-4 lg:mb-6">
            <DialogTitle className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              {isViewMode
                ? 'Visualiser le document'
                : selectedDocument
                ? 'Modifier le document'
                : 'Créer un nouveau document'}
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm lg:text-base">
              {isViewMode
                ? 'Consultez les détails du document'
                : selectedDocument
                ? 'Modifiez les informations du document'
                : 'Remplissez les informations pour créer un nouveau document'}
            </DialogDescription>
          </DialogHeader>
          <InvoiceEditor
            document={selectedDocument}
            onClose={handleEditorClose}
            viewMode={isViewMode}
            initialType={initialType}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-2xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-white/60 text-base">
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl h-11 px-6"
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}