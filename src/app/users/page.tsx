'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users as UsersIcon, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useCompleteUser } from '@/hooks/useCompleteUser';

interface User {
  id: number;
  email: string;
  name: string;
  photoUrl?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  phone?: string;
  address?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'travailleur',
    status: 'active',
    phone: '',
    address: '',
    photoUrl: '',
  });
  const { user: currentUser } = useCompleteUser();
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jhs_token');
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Floating particles effect
  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => i));
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jhs_token');
      const response = await fetch('/api/users?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jhs_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers();
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('jhs_token');
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        phone: formData.phone || null,
        address: formData.address || null,
        photoUrl: formData.photoUrl || null,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchUsers();
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const token = localStorage.getItem('jhs_token');
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'travailleur',
      status: 'active',
      phone: '',
      address: '',
      photoUrl: '',
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      address: user.address || '',
      photoUrl: user.photoUrl || '',
    });
    setIsEditDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: any; label: string; icon: string }> = {
      admin: { variant: 'default', label: 'Admin', icon: '👑' },
      travailleur: { variant: 'secondary', label: 'Travailleur', icon: '🔧' },
      client: { variant: 'outline', label: 'Client', icon: '👤' },
    };
    const config = variants[role] || { variant: 'outline', label: role, icon: '?' };
    return (
      <Badge variant={config.variant}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default">Actif</Badge>
    ) : (
      <Badge variant="destructive">Inactif</Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = (user: User) => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'travailleur' && user.id === currentUser.id) return true;
    return false;
  };
  const canDelete = isAdmin;
  const canCreate = isAdmin;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-800 relative overflow-hidden animate-in fade-in duration-700">
        {/* iOS-style subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none animate-in fade-in duration-1000" style={{ animationDelay: '200ms' }} />

        <div className="flex relative z-10">
          <CollapsibleSidebar />
          
          <main className="flex-1 px-2 sm:px-3 lg:px-5 py-2 sm:py-3 lg:py-5">
            {/* Header with glassmorphism */}
            <div className="mb-2 sm:mb-3 lg:mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-white/10 shadow-2xl flex-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg">
                    <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Utilisateurs</h1>
                    <p className="text-white/60 mt-0.5 text-xs sm:text-sm">
                      Gestion des accès et permissions
                    </p>
                  </div>
                </div>
              </div>
              
              {canCreate && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
                      <Plus className="h-5 w-5" />
                      Nouvel utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
                    <DialogHeader className="space-y-3 pb-6 border-b border-white/10">
                      <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                          <UserCircle className="h-6 w-6 text-primary" />
                        </div>
                        Créer un nouvel utilisateur
                      </DialogTitle>
                      <DialogDescription className="text-white/60 text-base">
                        Remplissez les informations de l'utilisateur
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-8 pt-6">
                      {/* Section: Informations personnelles */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-3">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-primary" />
                            Informations personnelles
                          </h3>
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        </div>

                        <div className="space-y-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                          <div className="space-y-3">
                            <Label htmlFor="name" className="text-white font-semibold flex items-center gap-2 text-base">
                              <UserCircle className="h-4 w-4 text-primary" />
                              Nom complet
                              <span className="text-primary text-lg">*</span>
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                              placeholder="Ex: Marie Dubois"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="email" className="text-white font-semibold flex items-center gap-2 text-base">
                              <Mail className="h-4 w-4 text-primary" />
                              Email
                              <span className="text-primary text-lg">*</span>
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                              placeholder="marie.dubois@jhs.fr"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="password" className="text-white font-semibold flex items-center gap-2 text-base">
                              Mot de passe
                              <span className="text-primary text-lg">*</span>
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              required
                              minLength={6}
                              placeholder="Minimum 6 caractères"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section: Rôle et statut */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-3">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            Rôle et statut
                          </h3>
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                          <div className="space-y-3">
                            <Label htmlFor="role" className="text-white font-semibold flex items-center gap-2 text-base">
                              Rôle
                              <span className="text-primary text-lg">*</span>
                            </Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900/98 backdrop-blur-xl border-white/10">
                                <SelectItem value="admin" className="text-white focus:bg-white/10 focus:text-white text-base">👑 Admin</SelectItem>
                                <SelectItem value="travailleur" className="text-white focus:bg-white/10 focus:text-white text-base">🔧 Travailleur</SelectItem>
                                <SelectItem value="client" className="text-white focus:bg-white/10 focus:text-white text-base">👤 Client</SelectItem>
                              </SelectContent>
                            </Select>
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
                                <SelectItem value="active" className="text-white focus:bg-white/10 focus:text-white text-base">Actif</SelectItem>
                                <SelectItem value="inactive" className="text-white focus:bg-white/10 focus:text-white text-base">Inactif</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Section: Coordonnées */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-3">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            Coordonnées
                          </h3>
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        </div>

                        <div className="space-y-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                          <div className="space-y-3">
                            <Label htmlFor="phone" className="text-white font-semibold flex items-center gap-2 text-base">
                              <Phone className="h-4 w-4 text-primary" />
                              Téléphone
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="0623456789"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="address" className="text-white font-semibold flex items-center gap-2 text-base">
                              <MapPin className="h-4 w-4 text-primary" />
                              Adresse
                            </Label>
                            <Input
                              id="address"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              placeholder="8 Rue du Travail, 33000 Bordeaux"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 justify-end pt-6 border-t border-white/10">
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
              )}
            </div>

            {/* Filters with glassmorphism */}
            <div className="mb-2 sm:mb-3 lg:mb-4 bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700" style={{ animationDelay: '300ms' }}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="travailleur">Travailleur</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 border border-white/10 shadow-2xl text-center animate-in fade-in duration-700" style={{ animationDelay: '400ms' }}>
                <UsersIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-xs sm:text-sm">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View with glassmorphism */}
                <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:hidden">
                  {filteredUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 shadow-2xl hover:bg-white/15 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                      style={{ 
                        animationDelay: `${400 + index * 50}ms`,
                        animation: 'fadeIn 0.5s ease-out forwards'
                      }}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30">
                          <AvatarImage src={user.photoUrl} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base text-white">{user.name}</h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                {getRoleBadge(user.role)}
                                {getStatusBadge(user.status)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 sm:space-y-1.5 mt-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-white/60">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            
                            {user.phone && (
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-white/60">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            )}

                            {user.address && (
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-white/60">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{user.address}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-white/50">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-2 sm:mt-3">
                            {canEdit(user) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(user)}
                                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1.5" />
                                Modifier
                              </Button>
                            )}
                            {canDelete && user.id !== currentUser?.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View with glassmorphism */}
                <div className="hidden lg:block bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '400ms' }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-white/70">Utilisateur</TableHead>
                        <TableHead className="text-white/70">Email</TableHead>
                        <TableHead className="text-white/70">Rôle</TableHead>
                        <TableHead className="text-white/70">Statut</TableHead>
                        <TableHead className="text-white/70">Contact</TableHead>
                        <TableHead className="text-white/70">Inscription</TableHead>
                        <TableHead className="text-right text-white/70">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="border-2 border-primary/30">
                                <AvatarImage src={user.photoUrl} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-white">{user.name}</p>
                                {user.lastLogin && (
                                  <p className="text-xs text-white/50">
                                    Vu {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <Mail className="h-4 w-4 text-white/40" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            {user.phone ? (
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <Phone className="h-4 w-4 text-white/40" />
                                {user.phone}
                              </div>
                            ) : (
                              <span className="text-white/40 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-white/70">
                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {canEdit(user) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                  onClick={() => openEditDialog(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && user.id !== currentUser?.id && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Edit Dialog */}
            {selectedUser && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
                  <DialogHeader className="space-y-3 pb-6 border-b border-white/10">
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                        <Edit className="h-6 w-6 text-primary" />
                      </div>
                      Modifier l'utilisateur
                    </DialogTitle>
                    <DialogDescription className="text-white/60 text-base">
                      Mettre à jour les informations de {selectedUser.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdate} className="space-y-8 pt-6">
                    {/* Section: Informations personnelles */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 pb-3">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-primary" />
                          Informations personnelles
                        </h3>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      </div>

                      <div className="space-y-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                        <div className="space-y-3">
                          <Label htmlFor="edit-name" className="text-white font-semibold flex items-center gap-2 text-base">
                            <UserCircle className="h-4 w-4 text-primary" />
                            Nom complet
                            <span className="text-primary text-lg">*</span>
                          </Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Ex: Marie Dubois"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="edit-email" className="text-white font-semibold flex items-center gap-2 text-base">
                            <Mail className="h-4 w-4 text-primary" />
                            Email
                            <span className="text-primary text-lg">*</span>
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="marie.dubois@jhs.fr"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="edit-password" className="text-white font-semibold flex items-center gap-2 text-base">
                            Nouveau mot de passe
                          </Label>
                          <Input
                            id="edit-password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            minLength={6}
                            placeholder="Laisser vide pour ne pas changer"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section: Rôle et statut */}
                    {isAdmin && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-3">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            Rôle et statut
                          </h3>
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                          <div className="space-y-3">
                            <Label htmlFor="edit-role" className="text-white font-semibold flex items-center gap-2 text-base">
                              Rôle
                              <span className="text-primary text-lg">*</span>
                            </Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900/98 backdrop-blur-xl border-white/10">
                                <SelectItem value="admin" className="text-white focus:bg-white/10 focus:text-white text-base">👑 Admin</SelectItem>
                                <SelectItem value="travailleur" className="text-white focus:bg-white/10 focus:text-white text-base">🔧 Travailleur</SelectItem>
                                <SelectItem value="client" className="text-white focus:bg-white/10 focus:text-white text-base">👤 Client</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="edit-status" className="text-white font-semibold text-base">
                              Statut
                            </Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900/98 backdrop-blur-xl border-white/10">
                                <SelectItem value="active" className="text-white focus:bg-white/10 focus:text-white text-base">Actif</SelectItem>
                                <SelectItem value="inactive" className="text-white focus:bg-white/10 focus:text-white text-base">Inactif</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section: Coordonnées */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 pb-3">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          Coordonnées
                        </h3>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      </div>

                      <div className="space-y-5 bg-white/5 rounded-2xl p-6 border border-white/10">
                        <div className="space-y-3">
                          <Label htmlFor="edit-phone" className="text-white font-semibold flex items-center gap-2 text-base">
                            <Phone className="h-4 w-4 text-primary" />
                            Téléphone
                          </Label>
                          <Input
                            id="edit-phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0623456789"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="edit-address" className="text-white font-semibold flex items-center gap-2 text-base">
                            <MapPin className="h-4 w-4 text-primary" />
                            Adresse
                          </Label>
                          <Input
                            id="edit-address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="8 Rue du Travail, 33000 Bordeaux"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-primary/60 transition-all h-12 text-base"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-6 border-t border-white/10">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
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
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}