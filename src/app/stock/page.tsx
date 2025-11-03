'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { 
  Package, 
  Plus, 
  Search,
  Trash2,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Package2,
  Box,
  CheckCircle2,
  AlertCircle,
  Wrench
} from 'lucide-react';

interface StockMateriau {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StockMateriel {
  id: number;
  name: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: number;
  itemType: string;
  itemId: number;
  userId: number | null;
  action: string;
  quantity: number;
  date: string;
  notes: string | null;
}

interface User {
  id: number;
  name: string;
}

export default function StockPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [materiaux, setMateriaux] = useState<StockMateriau[]>([]);
  const [materiels, setMateriels] = useState<StockMateriel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materiaux');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    status: 'disponible',
  });
  const [movementData, setMovementData] = useState({
    action: 'retrait',
    quantity: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jhs_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [materiauxRes, materielsRes, movementsRes, usersRes] = await Promise.all([
        fetch('/api/stock-materiaux?limit=1000', { headers }),
        fetch('/api/stock-materiels?limit=1000', { headers }),
        fetch('/api/stock-movements?limit=1000', { headers }),
        fetch('/api/users?limit=1000', { headers }),
      ]);

      if (materiauxRes.ok) {
        const data = await materiauxRes.json();
        setMateriaux(data);
      }
      if (materielsRes.ok) {
        const data = await materielsRes.json();
        setMateriels(data);
      }
      if (movementsRes.ok) {
        const data = await movementsRes.json();
        setMovements(data);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleCreateMateriau = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jhs_token');
      const response = await fetch('/api/stock-materiaux', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          quantity: parseInt(formData.quantity) || 0,
          unit: formData.unit,
          status: formData.status,
        }),
      });

      if (response.ok) {
        await fetchData();
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating materiau:', error);
    }
  };

  const handleCreateMateriel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jhs_token');
      const response = await fetch('/api/stock-materiels', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          quantity: parseInt(formData.quantity) || 0,
          status: formData.status,
        }),
      });

      if (response.ok) {
        await fetchData();
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating materiel:', error);
    }
  };

  const handleDelete = async (id: number, type: 'materiau' | 'materiel') => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const token = localStorage.getItem('jhs_token');
      const endpoint = type === 'materiau' ? '/api/stock-materiaux' : '/api/stock-materiels';
      const response = await fetch(`${endpoint}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('jhs_token');
      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemType: activeTab === 'materiaux' ? 'materiau' : 'materiel',
          itemId: selectedItem.id,
          action: movementData.action,
          quantity: parseInt(movementData.quantity),
          notes: movementData.notes || null,
        }),
      });

      if (response.ok) {
        const newQuantity = movementData.action === 'retrait' || movementData.action === 'suppression'
          ? selectedItem.quantity - parseInt(movementData.quantity)
          : selectedItem.quantity + parseInt(movementData.quantity);

        const endpoint = activeTab === 'materiaux' ? '/api/stock-materiaux' : '/api/stock-materiels';
        await fetch(`${endpoint}?id=${selectedItem.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: Math.max(0, newQuantity) }),
        });

        await fetchData();
        setIsMovementDialogOpen(false);
        setSelectedItem(null);
        setMovementData({ action: 'retrait', quantity: '', notes: '' });
      }
    } catch (error) {
      console.error('Error adding movement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      status: 'disponible',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      disponible: { variant: 'default', label: 'Disponible', icon: CheckCircle2 },
      emprunte: { variant: 'secondary', label: 'Emprunté', icon: AlertCircle },
      maintenance: { variant: 'destructive', label: 'Maintenance', icon: Wrench },
    };
    const config = variants[status] || { variant: 'outline', label: status, icon: Package };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'retrait':
      case 'suppression':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'retour':
      case 'ajout':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getItemName = (itemType: string, itemId: number) => {
    if (itemType === 'materiau') {
      const item = materiaux.find(m => m.id === itemId);
      return item?.name || 'Inconnu';
    } else {
      const item = materiels.find(m => m.id === itemId);
      return item?.name || 'Inconnu';
    }
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Système';
    const user = users.find(u => u.id === userId);
    return user?.name || 'Inconnu';
  };

  const filteredMateriaux = materiaux.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMateriels = materiels.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute allowedRoles={['admin', 'travailleur']}>
      <div className="min-h-screen bg-zinc-800 relative overflow-hidden animate-in fade-in duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none animate-in fade-in duration-1000" style={{ animationDelay: '200ms' }} />

        <div className="flex relative z-10">
          <CollapsibleSidebar />
          
          <main className="flex-1 px-2 sm:px-3 lg:px-5 py-2 sm:py-3 lg:py-5">
            <div className="mb-2 sm:mb-3 lg:mb-5 bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Gestion de Stock</h1>
                  <p className="text-white/60 mt-0.5 text-xs sm:text-sm">Matériaux et matériels de construction</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-3 lg:space-y-5">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-xl border border-white/10 p-1 rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-top-4 duration-700" style={{ animationDelay: '300ms' }}>
                <TabsTrigger value="materiaux" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm">
                  Matériaux ({materiaux.length})
                </TabsTrigger>
                <TabsTrigger value="materiels" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm">
                  Matériels ({materiels.length})
                </TabsTrigger>
                <TabsTrigger value="historique" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm">
                  Historique ({movements.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="materiaux" className="space-y-2 sm:space-y-3 lg:space-y-5">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700" style={{ animationDelay: '400ms' }}>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          placeholder="Rechercher un matériau..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="disponible">Disponible</SelectItem>
                        <SelectItem value="emprunte">Emprunté</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 w-full sm:w-auto">
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Nouveau matériau</span>
                          <span className="sm:hidden">Nouveau</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <DialogHeader className="space-y-3 pb-6 border-b border-white/10">
                          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                              <Package2 className="h-6 w-6 text-primary" />
                            </div>
                            Ajouter un matériau
                          </DialogTitle>
                          <DialogDescription className="text-white/60 text-base">
                            Créer un nouvel article en stock
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateMateriau} className="space-y-6 pt-6">
                          <div className="space-y-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                            <div className="space-y-3">
                              <Label htmlFor="name" className="text-white font-semibold flex items-center gap-2 text-base">
                                <Package2 className="h-4 w-4 text-primary" />
                                Nom du matériau
                                <span className="text-primary text-lg">*</span>
                              </Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Ex: Ciment, Sable, Briques..."
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-3">
                                <Label htmlFor="quantity" className="text-white font-semibold text-base">
                                  Quantité
                                </Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  min="0"
                                  value={formData.quantity}
                                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                  placeholder="0"
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                                />
                              </div>
                              <div className="space-y-3">
                                <Label htmlFor="unit" className="text-white font-semibold flex items-center gap-2 text-base">
                                  Unité
                                  <span className="text-primary text-lg">*</span>
                                </Label>
                                <Input
                                  id="unit"
                                  placeholder="kg, m³, sac..."
                                  value={formData.unit}
                                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                  required
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="status" className="text-white font-semibold text-base">
                                Statut
                              </Label>
                              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900/98 backdrop-blur-xl border-white/10">
                                  <SelectItem value="disponible" className="text-white focus:bg-white/10 focus:text-white text-base">Disponible</SelectItem>
                                  <SelectItem value="emprunte" className="text-white focus:bg-white/10 focus:text-white text-base">Emprunté</SelectItem>
                                  <SelectItem value="maintenance" className="text-white focus:bg-white/10 focus:text-white text-base">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsCreateDialogOpen(false)}
                              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all h-11 px-6 text-base"
                            >
                              Annuler
                            </Button>
                            <Button 
                              type="submit"
                              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all h-11 px-6 text-base font-semibold"
                            >
                              Créer
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="md:hidden space-y-2 sm:space-y-3">
                  {loading ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 flex justify-center items-center animate-in fade-in slide-in-from-bottom-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredMateriaux.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center animate-in fade-in slide-in-from-bottom-4">
                      <Package2 className="h-12 w-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">Aucun matériau trouvé</p>
                    </div>
                  ) : (
                    filteredMateriaux.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 shadow-2xl hover:bg-white/15 transition-all duration-300"
                        style={{ animationDelay: `${500 + index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div>
                            <h3 className="font-bold text-base sm:text-lg text-white mb-1">{item.name}</h3>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="p-1.5 sm:p-2 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                            <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2 sm:mb-3">
                          <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                            <p className="text-xs text-white/50 mb-1">Quantité</p>
                            <p className="font-bold text-xl sm:text-2xl text-white">{item.quantity}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                            <p className="text-xs text-white/50 mb-1">Unité</p>
                            <p className="font-bold text-xl sm:text-2xl text-white">{item.unit}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsMovementDialogOpen(true);
                            }}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Mouvement
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id, 'materiau')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden md:block bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredMateriaux.length === 0 ? (
                    <div className="py-12 text-center text-white/60">
                      Aucun matériau trouvé
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-white/70">Nom</TableHead>
                          <TableHead className="text-white/70">Quantité</TableHead>
                          <TableHead className="text-white/70">Unité</TableHead>
                          <TableHead className="text-white/70">Statut</TableHead>
                          <TableHead className="text-right text-white/70">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMateriaux.map((item) => (
                          <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="font-medium text-white">{item.name}</TableCell>
                            <TableCell className="text-white/80">{item.quantity}</TableCell>
                            <TableCell className="text-white/80">{item.unit}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsMovementDialogOpen(true);
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(item.id, 'materiau')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="materiels" className="space-y-2 sm:space-y-3 lg:space-y-5">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-white/10 shadow-2xl">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          placeholder="Rechercher un matériel..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="disponible">Disponible</SelectItem>
                        <SelectItem value="emprunte">Emprunté</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 w-full sm:w-auto">
                          <Plus className="h-4 w-4" />
                          Nouveau matériel
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <DialogHeader className="space-y-3 pb-6 border-b border-white/10">
                          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                              <Box className="h-6 w-6 text-primary" />
                            </div>
                            Ajouter un matériel
                          </DialogTitle>
                          <DialogDescription className="text-white/60 text-base">
                            Créer un nouvel équipement
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateMateriel} className="space-y-6 pt-6">
                          <div className="space-y-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                            <div className="space-y-3">
                              <Label htmlFor="name-materiel" className="text-white font-semibold flex items-center gap-2 text-base">
                                <Box className="h-4 w-4 text-primary" />
                                Nom du matériel
                                <span className="text-primary text-lg">*</span>
                              </Label>
                              <Input
                                id="name-materiel"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Ex: Perceuse, Échelle..."
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="quantity-materiel" className="text-white font-semibold text-base">
                                Quantité
                              </Label>
                              <Input
                                id="quantity-materiel"
                                type="number"
                                min="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="0"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="status-materiel" className="text-white font-semibold text-base">
                                Statut
                              </Label>
                              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900/98 backdrop-blur-xl border-white/10">
                                  <SelectItem value="disponible" className="text-white focus:bg-white/10 focus:text-white text-base">Disponible</SelectItem>
                                  <SelectItem value="emprunte" className="text-white focus:bg-white/10 focus:text-white text-base">Emprunté</SelectItem>
                                  <SelectItem value="maintenance" className="text-white focus:bg-white/10 focus:text-white text-base">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsCreateDialogOpen(false)}
                              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all h-11 px-6 text-base"
                            >
                              Annuler
                            </Button>
                            <Button 
                              type="submit"
                              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all h-11 px-6 text-base font-semibold"
                            >
                              Créer
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="md:hidden space-y-2 sm:space-y-3">
                  {loading ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredMateriels.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
                      <Box className="h-12 w-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">Aucun matériel trouvé</p>
                    </div>
                  ) : (
                    filteredMateriels.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 shadow-2xl hover:bg-white/15 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div>
                            <h3 className="font-bold text-base sm:text-lg text-white mb-1">{item.name}</h3>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="p-1.5 sm:p-2 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                            <Box className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                          <p className="text-xs text-white/50 mb-1">Quantité</p>
                          <p className="font-bold text-xl sm:text-2xl text-white">{item.quantity}</p>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsMovementDialogOpen(true);
                            }}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Mouvement
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id, 'materiel')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden md:block bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredMateriels.length === 0 ? (
                    <div className="py-12 text-center text-white/60">
                      Aucun matériel trouvé
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-white/70">Nom</TableHead>
                          <TableHead className="text-white/70">Quantité</TableHead>
                          <TableHead className="text-white/70">Statut</TableHead>
                          <TableHead className="text-right text-white/70">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMateriels.map((item) => (
                          <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="font-medium text-white">{item.name}</TableCell>
                            <TableCell className="text-white/80">{item.quantity}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsMovementDialogOpen(true);
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(item.id, 'materiel')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="historique" className="space-y-2 sm:space-y-3 lg:space-y-5">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3 sm:mb-5">
                    <div className="p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                      <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Historique des mouvements</h2>
                      <p className="text-white/60 text-xs">Journal complet de tous les mouvements de stock</p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="py-12 text-center">
                      <History className="h-12 w-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">Aucun mouvement enregistré</p>
                    </div>
                  ) : (
                    <>
                      <div className="md:hidden space-y-2 sm:space-y-3">
                        {movements.map((movement, index) => (
                          <div
                            key={movement.id}
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                            style={{ 
                              borderLeftWidth: '4px',
                              borderLeftColor: movement.action === 'retrait' || movement.action === 'suppression' 
                                ? 'hsl(var(--destructive))' 
                                : 'hsl(var(--chart-3))'
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-lg ${
                                movement.action === 'retrait' || movement.action === 'suppression'
                                  ? 'bg-destructive/10'
                                  : 'bg-chart-3/10'
                              }`}>
                                {getActionIcon(movement.action)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base mb-1 line-clamp-1 text-white">
                                  {getItemName(movement.itemType, movement.itemId)}
                                </h3>
                                <Badge variant="outline" className="text-xs">{movement.itemType}</Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 mt-3">
                              <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                                <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Action</p>
                                <p className="font-bold capitalize text-white">{movement.action}</p>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                                <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Quantité</p>
                                <p className="font-bold text-xl text-white">{movement.quantity}</p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 mt-3 space-y-2.5">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-white/50">Utilisateur</span>
                                <span className="font-semibold text-sm text-white">{getUserName(movement.userId)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-white/50">Date</span>
                                <span className="font-semibold text-sm text-white">
                                  {new Date(movement.date).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              {movement.notes && (
                                <div className="pt-2 border-t border-white/10">
                                  <p className="text-xs text-white/50 mb-1">Notes</p>
                                  <p className="text-sm font-medium text-white">{movement.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                              <TableHead className="text-white/70">Date</TableHead>
                              <TableHead className="text-white/70">Article</TableHead>
                              <TableHead className="text-white/70">Type</TableHead>
                              <TableHead className="text-white/70">Action</TableHead>
                              <TableHead className="text-white/70">Quantité</TableHead>
                              <TableHead className="text-white/70">Utilisateur</TableHead>
                              <TableHead className="text-white/70">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {movements.map((movement) => (
                              <TableRow key={movement.id} className="border-white/10 hover:bg-white/5">
                                <TableCell className="text-sm text-white/80">
                                  {new Date(movement.date).toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="font-medium text-white">
                                  {getItemName(movement.itemType, movement.itemId)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{movement.itemType}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getActionIcon(movement.action)}
                                    <span className="capitalize text-white/80">{movement.action}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white/80">{movement.quantity}</TableCell>
                                <TableCell className="text-white/80">{getUserName(movement.userId)}</TableCell>
                                <TableCell className="text-sm text-white/60">
                                  {movement.notes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
              <DialogContent className="bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <DialogHeader className="space-y-3 pb-6 border-b border-white/10">
                  <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                      <History className="h-6 w-6 text-primary" />
                    </div>
                    Nouveau mouvement
                  </DialogTitle>
                  <DialogDescription className="text-white/60 text-base">
                    {selectedItem?.name}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMovement} className="space-y-6 pt-6">
                  <div className="space-y-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="space-y-3">
                      <Label htmlFor="action" className="text-white font-semibold flex items-center gap-2 text-base">
                        <History className="h-4 w-4 text-primary" />
                        Action
                        <span className="text-primary text-lg">*</span>
                      </Label>
                      <Select value={movementData.action} onValueChange={(value) => setMovementData({ ...movementData, action: value })}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900/98 backdrop-blur-xl border-white/10">
                          <SelectItem value="retrait" className="text-white focus:bg-white/10 focus:text-white text-base">Retrait</SelectItem>
                          <SelectItem value="retour" className="text-white focus:bg-white/10 focus:text-white text-base">Retour</SelectItem>
                          <SelectItem value="ajout" className="text-white focus:bg-white/10 focus:text-white text-base">Ajout</SelectItem>
                          <SelectItem value="suppression" className="text-white focus:bg-white/10 focus:text-white text-base">Suppression</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="quantity-movement" className="text-white font-semibold flex items-center gap-2 text-base">
                        Quantité
                        <span className="text-primary text-lg">*</span>
                      </Label>
                      <Input
                        id="quantity-movement"
                        type="number"
                        min="1"
                        value={movementData.quantity}
                        onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
                        required
                        placeholder="Entrez la quantité"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-white font-semibold text-base">
                        Notes
                      </Label>
                      <Input
                        id="notes"
                        value={movementData.notes}
                        onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
                        placeholder="Raison du mouvement..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsMovementDialogOpen(false)}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all h-11 px-6 text-base"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all h-11 px-6 text-base font-semibold"
                    >
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}