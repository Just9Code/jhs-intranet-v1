'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search,
  Edit,
  Trash2,
  FileText,
  Calendar,
  MapPin,
  User,
  Loader2,
  Upload,
  Download,
  File,
  Building2,
  AlertCircle,
  Image as ImageIcon,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useCompleteUser } from '@/hooks/useCompleteUser';
import { toast } from 'sonner';

interface Chantier {
  id: number;
  name: string;
  clientId: number | null;
  responsableId: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  address: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChantierFile {
  id: number;
  chantierId: number | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: number | null;
  uploadedAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [files, setFiles] = useState<ChantierFile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    clientId: '',
    responsableId: '',
    status: 'en_attente',
    startDate: '',
    endDate: '',
    description: '',
    notes: '',
  });
  const { user } = useCompleteUser();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chantiersRes, usersRes, filesRes] = await Promise.all([
        fetch('/api/chantiers?limit=1000'),
        fetch('/api/users?limit=1000'),
        fetch('/api/chantier-files?limit=1000'),
      ]);

      const chantiersData = await chantiersRes.json();
      const usersData = await usersRes.json();
      const filesData = await filesRes.json();

      if (user?.role === 'client') {
        setChantiers(chantiersData.filter((c: Chantier) => c.clientId === user.id));
      } else {
        setChantiers(chantiersData);
      }
      
      // Ensure usersData is an array before setting it
      setUsers(Array.isArray(usersData) ? usersData : []);
      setFiles(Array.isArray(filesData) ? filesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
      // Set empty arrays on error to prevent undefined issues
      setUsers([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Le nom du chantier est requis');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('L\'adresse est requise');
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        clientId: formData.clientId && formData.clientId !== '' ? parseInt(formData.clientId) : null,
        responsableId: formData.responsableId && formData.responsableId !== '' ? parseInt(formData.responsableId) : null,
        status: formData.status,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
      };

      const response = await fetch('/api/chantiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Chantier créé avec succès');
        await fetchData();
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating chantier:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (id: number) => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Le nom du chantier est requis');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('L\'adresse est requise');
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        clientId: formData.clientId && formData.clientId !== '' ? parseInt(formData.clientId) : null,
        responsableId: formData.responsableId && formData.responsableId !== '' ? parseInt(formData.responsableId) : null,
        status: formData.status,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
      };

      const response = await fetch(`/api/chantiers?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Chantier modifié avec succès');
        await fetchData();
        setSelectedChantier(null);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating chantier:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/chantiers?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Chantier supprimé avec succès');
        await fetchData();
        setIsDetailDialogOpen(false);
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting chantier:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      clientId: '',
      responsableId: '',
      status: 'en_attente',
      startDate: '',
      endDate: '',
      description: '',
      notes: '',
    });
  };

  const openEditDialog = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setFormData({
      name: chantier.name,
      address: chantier.address,
      clientId: chantier.clientId?.toString() || '',
      responsableId: chantier.responsableId?.toString() || '',
      status: chantier.status,
      startDate: chantier.startDate || '',
      endDate: chantier.endDate || '',
      description: chantier.description || '',
      notes: chantier.notes || '',
    });
  };

  const handlePhotoUpload = async (chantierId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);

    try {
      for (const file of Array.from(files)) {
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
        if (!validImageTypes.includes(file.type)) {
          toast.error(`Format non supporté: ${file.name}`);
          continue;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`Fichier trop volumineux: ${file.name}. Max 5MB.`);
          continue;
        }

        // Upload to Supabase Storage instead of base64
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'chantier-files');
        formData.append('chantierId', chantierId.toString());
        formData.append('fileType', 'photo');

        const uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          toast.error(`Erreur upload ${file.name}`);
          continue;
        }

        const uploadData = await uploadResponse.json();
        
        // Save file metadata to database with Supabase URL
        const response = await fetch('/api/chantier-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chantierId,
            fileName: file.name,
            fileUrl: uploadData.url, // Supabase Storage URL
            fileType: 'photo',
            uploadedBy: user?.id,
          }),
        });

        if (!response.ok) {
          toast.error(`Erreur sauvegarde ${file.name}`);
        }
      }

      await fetchData();
      toast.success('Photos uploadées avec succès');
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Erreur lors de l\'upload des photos');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (chantierId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDocument(true);

    try {
      for (const file of Array.from(files)) {
        const validDocTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!validDocTypes.includes(file.type)) {
          toast.error(`Format non supporté: ${file.name}`);
          continue;
        }

        let fileType = 'document';
        if (file.type === 'application/pdf') {
          fileType = 'pdf';
        } else if (file.type.includes('word')) {
          fileType = 'doc';
        }

        // Upload to Supabase Storage instead of base64
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'chantier-files');
        formData.append('chantierId', chantierId.toString());
        formData.append('fileType', fileType);

        const uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          toast.error(`Erreur upload ${file.name}`);
          continue;
        }

        const uploadData = await uploadResponse.json();
        
        // Save file metadata to database with Supabase URL
        await fetch('/api/chantier-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chantierId,
            fileName: file.name,
            fileUrl: uploadData.url, // Supabase Storage URL
            fileType,
            uploadedBy: user?.id,
          }),
        });
      }

      await fetchData();
      toast.success('Documents uploadés avec succès');
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Erreur lors de l\'upload des documents');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const response = await fetch(`/api/chantier-files?id=${photoId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Photo supprimée');
        await fetchData();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      const response = await fetch(`/api/chantier-files?id=${docId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Document supprimé');
        await fetchData();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDocumentDownload = async (file: ChantierFile) => {
    try {
      let base64Data = file.fileUrl;
      let mimeType = 'application/pdf';
      
      if (file.fileUrl.includes(',')) {
        const parts = file.fileUrl.split(',');
        base64Data = parts[1];
        const header = parts[0];
        if (header.includes(':') && header.includes(';')) {
          mimeType = header.split(':')[1].split(';')[0];
        }
      }
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const getChantierPhotos = (chantierId: number) => {
    return files.filter(f => f.chantierId === chantierId && f.fileType === 'photo');
  };

  const getChantierDocuments = (chantierId: number) => {
    return files.filter(f => f.chantierId === chantierId && f.fileType !== 'photo');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      en_cours: { className: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'En cours' },
      termine: { className: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Terminé' },
      en_attente: { className: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'En attente' },
      annule: { className: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Annulé' },
    };
    const config = variants[status] || { className: 'bg-zinc-700 text-zinc-300', label: status };
    return <Badge className={`${config.className} border`}>{config.label}</Badge>;
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Non assigné';
    const u = users.find(u => u.id === userId);
    return u?.name || 'Inconnu';
  };

  const filteredChantiers = chantiers.filter(chantier => {
    const matchesSearch = chantier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chantier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canEdit = user?.role === 'admin' || user?.role === 'travailleur';
  const canDelete = user?.role === 'admin' || user?.role === 'travailleur';

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-950">
        <div className="flex">
          <CollapsibleSidebar />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Chantiers</h1>
                  <p className="text-zinc-400 text-sm">Gérez vos projets de construction</p>
                </div>
                
                {canEdit && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg" 
                        className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/20"
                      >
                        <Plus className="h-5 w-5" />
                        Nouveau chantier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-2xl text-white">
                          {selectedChantier ? 'Modifier le chantier' : 'Nouveau chantier'}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <form onSubmit={selectedChantier ? (e) => { e.preventDefault(); handleUpdate(selectedChantier.id); } : handleCreate} className="space-y-6 mt-4">
                        {/* Informations principales */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="name" className="text-zinc-300">Nom du chantier *</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Villa Marseille, Immeuble Lyon..."
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="address" className="text-zinc-300">Adresse *</Label>
                              <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                                placeholder="123 Rue de la République, 13001 Marseille"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Attribution et Statut */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="clientId" className="text-zinc-300">Client</Label>
                            <Select value={formData.clientId || "none"} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                              <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white rounded-xl">
                                <SelectValue placeholder="Aucun client" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="none">Aucun</SelectItem>
                                {users.filter(u => u.role === 'client').map(u => (
                                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="responsableId" className="text-zinc-300">Responsable</Label>
                            <Select value={formData.responsableId || "none"} onValueChange={(value) => setFormData({ ...formData, responsableId: value })}>
                              <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white rounded-xl">
                                <SelectValue placeholder="Aucun responsable" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="none">Aucun</SelectItem>
                                {users.filter(u => u.role === 'travailleur' || u.role === 'admin').map(u => (
                                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="status" className="text-zinc-300">Statut</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="en_cours">En cours</SelectItem>
                                <SelectItem value="termine">Terminé</SelectItem>
                                <SelectItem value="annule">Annulé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate" className="text-zinc-300">Date de début</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              className="mt-1.5 bg-zinc-800 border-zinc-700 text-white rounded-xl"
                            />
                          </div>

                          <div>
                            <Label htmlFor="endDate" className="text-zinc-300">Date de fin</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              className="mt-1.5 bg-zinc-800 border-zinc-700 text-white rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Description et Notes */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="description" className="text-zinc-300">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={3}
                              placeholder="Description des travaux..."
                              className="mt-1.5 resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
                            />
                          </div>

                          <div>
                            <Label htmlFor="notes" className="text-zinc-300">Notes internes</Label>
                            <Textarea
                              id="notes"
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              rows={2}
                              placeholder="Informations complémentaires..."
                              className="mt-1.5 resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setIsCreateDialogOpen(false);
                              setSelectedChantier(null);
                              resetForm();
                            }}
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 rounded-xl"
                          >
                            Annuler
                          </Button>
                          <Button 
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl"
                          >
                            {selectedChantier ? 'Enregistrer' : 'Créer'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Rechercher un chantier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-zinc-800/50 border-zinc-700 text-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                    <SelectItem value="annule">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Chantiers Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredChantiers.length === 0 ? (
              <Card className="p-12 text-center bg-zinc-900/50 border-zinc-800">
                <Building2 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Aucun chantier</h3>
                <p className="text-zinc-400">Commencez par créer votre premier chantier</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredChantiers.map((chantier) => (
                  <Card
                    key={chantier.id}
                    className="group p-5 cursor-pointer bg-zinc-900/80 border-zinc-800 hover:border-primary/50 transition-all duration-300 rounded-2xl relative"
                    onClick={() => {
                      setSelectedChantier(chantier);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    {/* Admin-only ID badge */}
                    {user?.role === 'admin' && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md">
                        <span className="text-[10px] font-mono text-primary/60">#{chantier.id}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 pr-12">
                        <h3 className="text-lg font-bold text-white mb-1">{chantier.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="line-clamp-1">{chantier.address}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(chantier.status)}
                      
                      <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <User className="h-4 w-4 text-primary" />
                        <span>{getUserName(chantier.clientId)}</span>
                      </div>
                      
                      {chantier.startDate && (
                        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{formatDate(chantier.startDate)}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Detail Dialog - NEW GLASSMORPHISM DESIGN */}
            {selectedChantier && (
              <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800/50">
                  {/* Gradient Header avec glassmorphism */}
                  <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-transparent border-b border-zinc-800/50 backdrop-blur-xl">
                    {/* Decorative blur orbs */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl" />
                    
                    <div className="relative">
                      <div className="flex-1 mb-4 pr-12">
                        <h2 className="text-2xl font-bold mb-3 text-white">{selectedChantier.name}</h2>
                        <div className="flex flex-wrap items-center gap-3">
                          {getStatusBadge(selectedChantier.status)}
                          <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                            <MapPin className="h-4 w-4 text-primary/80 flex-shrink-0" />
                            <span>{selectedChantier.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Boutons d'action en bas du header, bien séparés */}
                      {canEdit && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              openEditDialog(selectedChantier);
                              setIsDetailDialogOpen(false);
                              setIsCreateDialogOpen(true);
                            }}
                            className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-xl rounded-xl px-4"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Modifier</span>
                          </Button>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Supprimer ce chantier ?')) {
                                  handleDelete(selectedChantier.id);
                                }
                              }}
                              className="gap-2 bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 backdrop-blur-xl rounded-xl px-4"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Supprimer</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compact Glassmorphism Tabs */}
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                    <Tabs defaultValue="info" className="w-full">
                      {/* Pills style tabs with glassmorphism */}
                      <div className="px-6 py-3 bg-zinc-900/30 backdrop-blur-sm border-b border-zinc-800/50">
                        <TabsList className="h-9 p-1 bg-zinc-800/40 backdrop-blur-xl border border-zinc-700/50 rounded-full inline-flex gap-1">
                          <TabsTrigger 
                            value="info" 
                            className="gap-1.5 text-zinc-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-full px-3 py-1 text-xs font-medium transition-all hover:text-white hover:bg-zinc-700/50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Infos
                          </TabsTrigger>
                          <TabsTrigger 
                            value="photos" 
                            className="gap-1.5 text-zinc-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-full px-3 py-1 text-xs font-medium transition-all hover:text-white hover:bg-zinc-700/50"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            Photos
                            <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">
                              {getChantierPhotos(selectedChantier.id).length}
                            </span>
                          </TabsTrigger>
                          <TabsTrigger 
                            value="docs" 
                            className="gap-1.5 text-zinc-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-full px-3 py-1 text-xs font-medium transition-all hover:text-white hover:bg-zinc-700/50"
                          >
                            <File className="h-3.5 w-3.5" />
                            Docs
                            <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">
                              {getChantierDocuments(selectedChantier.id).length}
                            </span>
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <div className="p-4">
                        <TabsContent value="info" className="space-y-2 mt-0">
                          {/* Compact info grid with glassmorphism */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Client */}
                            <div className="p-2 bg-gradient-to-br from-primary/10 via-cyan-500/5 to-transparent backdrop-blur-xl border border-white/10 rounded-lg">
                              <div className="flex items-center gap-1 mb-0.5">
                                <User className="h-3 w-3 text-primary" />
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Client</span>
                              </div>
                              <p className="text-[11px] font-semibold text-white">{getUserName(selectedChantier.clientId)}</p>
                            </div>
                            
                            {/* Responsable */}
                            <div className="p-2 bg-gradient-to-br from-cyan-500/10 via-primary/5 to-transparent backdrop-blur-xl border border-white/10 rounded-lg">
                              <div className="flex items-center gap-1 mb-0.5">
                                <User className="h-3 w-3 text-cyan-400" />
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Responsable</span>
                              </div>
                              <p className="text-[11px] font-semibold text-white">{getUserName(selectedChantier.responsableId)}</p>
                            </div>
                            
                            {/* Date début */}
                            <div className="p-2 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl border border-white/10 rounded-lg">
                              <div className="flex items-center gap-1 mb-0.5">
                                <Calendar className="h-3 w-3 text-green-400" />
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Début</span>
                              </div>
                              <p className="text-[11px] font-semibold text-white">{formatDate(selectedChantier.startDate)}</p>
                            </div>
                            
                            {/* Date fin */}
                            <div className="p-2 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent backdrop-blur-xl border border-white/10 rounded-lg">
                              <div className="flex items-center gap-1 mb-0.5">
                                <Clock className="h-3 w-3 text-orange-400" />
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Fin</span>
                              </div>
                              <p className="text-[11px] font-semibold text-white">{formatDate(selectedChantier.endDate)}</p>
                            </div>
                          </div>

                          {/* Description - fluid layout */}
                          {selectedChantier.description && (
                            <div className="p-2.5 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent backdrop-blur-xl border border-white/10 rounded-lg">
                              <div className="flex items-center gap-1 mb-1">
                                <FileText className="h-3 w-3 text-blue-400" />
                                <span className="text-[9px] font-bold text-white">Description</span>
                              </div>
                              <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedChantier.description}</p>
                            </div>
                          )}

                          {/* Notes - fluid layout */}
                          {selectedChantier.notes && (
                            <div className="p-2.5 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent backdrop-blur-xl border border-purple-400/20 rounded-lg">
                              <div className="flex items-center gap-1 mb-1">
                                <AlertCircle className="h-3 w-3 text-purple-400" />
                                <span className="text-[9px] font-bold text-purple-300">Notes internes</span>
                              </div>
                              <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{selectedChantier.notes}</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="photos" className="space-y-4 mt-0">
                          {canEdit && (
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => document.getElementById(`photo-upload-${selectedChantier.id}`)?.click()}
                                disabled={isUploadingPhoto}
                                className="gap-2 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white rounded-full px-4 shadow-lg shadow-primary/20"
                              >
                                {isUploadingPhoto ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                Ajouter
                              </Button>
                              <input
                                id={`photo-upload-${selectedChantier.id}`}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(selectedChantier.id, e)}
                              />
                            </div>
                          )}
                          <PhotoGallery
                            photos={getChantierPhotos(selectedChantier.id)}
                            onDelete={canDelete ? handleDeletePhoto : undefined}
                            canDelete={canDelete}
                          />
                        </TabsContent>

                        <TabsContent value="docs" className="space-y-4 mt-0">
                          {canEdit && (
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => document.getElementById(`doc-upload-${selectedChantier.id}`)?.click()}
                                disabled={isUploadingDocument}
                                className="gap-2 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white rounded-full px-4 shadow-lg shadow-primary/20"
                              >
                                {isUploadingDocument ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                Ajouter
                              </Button>
                              <input
                                id={`doc-upload-${selectedChantier.id}`}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => handleDocumentUpload(selectedChantier.id, e)}
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            {getChantierDocuments(selectedChantier.id).length === 0 ? (
                              <div className="p-12 text-center bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-2xl">
                                <File className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                                <p className="text-sm text-zinc-400">Aucun document</p>
                              </div>
                            ) : (
                              getChantierDocuments(selectedChantier.id).map((file) => (
                                <div key={file.id} className="p-3 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl hover:border-primary/30 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className={`p-2 rounded-lg ${file.fileType === 'pdf' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                        <FileText className={`h-4 w-4 ${file.fileType === 'pdf' ? 'text-red-400' : 'text-blue-400'}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-white">{file.fileName}</p>
                                        <p className="text-xs text-zinc-500">
                                          {new Date(file.uploadedAt).toLocaleDateString('fr-FR')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDocumentDownload(file)}
                                        className="hover:bg-primary/10 text-primary rounded-lg h-8 w-8 p-0"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      {canDelete && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (confirm('Supprimer ce document ?')) {
                                              handleDeleteDocument(file.id);
                                            }
                                          }}
                                          className="hover:bg-red-500/10 text-red-400 rounded-lg h-8 w-8 p-0"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}