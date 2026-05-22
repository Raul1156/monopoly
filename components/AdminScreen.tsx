import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Shield,
  Users,
  Gamepad2,
  BarChart3,
  Ban,
  CheckCircle,
  Star,
  RotateCcw,
  Loader2,
  LogOut
} from 'lucide-react';
import { apiService, type User as UserType } from '../src/services/apiService';
import { toast } from 'sonner';

interface AdminScreenProps {
  currentUser: UserType;
  onLogout: () => void;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  elo: number;
  monedaLobby: number;
  partidasJugadas: number;
  partidasGanadas: number;
  activo: boolean;
  esAdmin: boolean;
  creadoEn: string;
  ultimoLogin: string | null;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  activeGames: number;
  bannedUsers: number;
}

export function AdminScreen({ currentUser, onLogout }: AdminScreenProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        apiService.getAdminUsers(currentUser.id),
        apiService.getAdminStats(currentUser.id)
      ]);
      setUsers(usersData as AdminUser[]);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
      toast.error('Error al cargar datos de administración');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: number) => {
    setActionLoading(userId);
    try {
      await apiService.banUser(userId, currentUser.id);
      toast.success('Usuario baneado');
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (userId: number) => {
    setActionLoading(userId);
    try {
      await apiService.unbanUser(userId, currentUser.id);
      toast.success('Usuario desbaneado');
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    setActionLoading(userId);
    try {
      await apiService.makeAdmin(userId, currentUser.id);
      toast.success('Usuario promovido a admin');
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetElo = async (userId: number) => {
    setActionLoading(userId);
    try {
      await apiService.resetElo(userId, currentUser.id);
      toast.success('ELO reseteado a 1000');
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  if (!currentUser.isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-red-900/40 border-red-500/30">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-white/60">No tienes permisos de administrador</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="text-white/60 ml-3">Cargando panel de administración...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 max-w-7xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <Card className="bg-black/60 border-red-500/30 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-400" />
              <div>
                <h1 className="text-white text-2xl font-bold">Panel de Administración</h1>
                <p className="text-red-300/70">Gestión de usuarios y partidas</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onLogout}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-black/40 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{stats.totalUsers}</p>
              <p className="text-white/50 text-xs">Total Usuarios</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-green-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{stats.activeUsers}</p>
              <p className="text-white/50 text-xs">Activos</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-red-500/20">
            <CardContent className="p-4 text-center">
              <Ban className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{stats.bannedUsers}</p>
              <p className="text-white/50 text-xs">Baneados</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{stats.totalGames}</p>
              <p className="text-white/50 text-xs">Total Partidas</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-amber-500/20">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{stats.activeGames}</p>
              <p className="text-white/50 text-xs">En Curso</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="bg-black/40 border-amber-500/20 flex-1">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-amber-400" />
            Gestión de Usuarios ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className={`rounded-lg border p-4 flex items-center justify-between transition-colors ${
                  user.activo 
                    ? 'bg-black/30 border-zinc-700 hover:border-zinc-600' 
                    : 'bg-red-900/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium truncate">{user.username}</span>
                      {user.esAdmin && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Admin</Badge>
                      )}
                      {!user.activo && (
                        <Badge className="bg-red-900/40 text-red-400 border-red-500/30 text-xs">Baneado</Badge>
                      )}
                    </div>
                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-white/60 shrink-0">
                    <span>ELO: {user.elo}</span>
                    <span>{user.partidasJugadas} partidas</span>
                    <span>{user.partidasGanadas} ganadas</span>
                  </div>
                </div>

                {/* Actions */}
                {user.id !== currentUser.id && (
                  <div className="flex items-center space-x-2 ml-4 shrink-0">
                    {user.activo ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBan(user.id)}
                        disabled={actionLoading === user.id}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                      >
                        {actionLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3 mr-1" />}
                        Banear
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnban(user.id)}
                        disabled={actionLoading === user.id}
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
                      >
                        {actionLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        Desbanear
                      </Button>
                    )}
                    {!user.esAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMakeAdmin(user.id)}
                        disabled={actionLoading === user.id}
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
                      >
                        <Star className="w-3 h-3 mr-1" /> Admin
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetElo(user.id)}
                      disabled={actionLoading === user.id}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> ELO
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
