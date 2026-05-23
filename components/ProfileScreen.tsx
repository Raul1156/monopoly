import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  User,
  Edit,
  Trophy,
  Coins,
  Clock,
  TrendingUp,
  Award,
  Flame,
  Shield,
  Check,
  X,
  Lock
} from 'lucide-react';
import { apiService, type User as UserType, type Achievement } from '../src/services/apiService';
import { toast } from 'sonner';

interface ProfileScreenProps {
  currentUser: UserType;
  onUserUpdate?: (user: UserType) => void;
}

export function ProfileScreen({ currentUser, onUserUpdate }: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    apiService.getAchievements(currentUser.id)
      .then(setAchievements)
      .catch(() => setAchievements([]));
  }, [currentUser.id]);

  const handleSaveProfile = async () => {
    try {
      const updated = await apiService.updateUser(currentUser.id, {
        ...currentUser,
        username: editUsername,
        email: editEmail
      });
      onUserUpdate?.(updated);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      toast.error(msg);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setPasswordLoading(true);
    try {
      await apiService.changePassword(currentUser.id, currentPassword, newPassword);
      toast.success('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar contraseña';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const winRate = currentUser.gamesPlayed > 0 ? Math.round((currentUser.gamesWon / currentUser.gamesPlayed) * 100) : 0;
  const earnedAchievements = achievements.filter(a => a.earned);

  return (
    <div className="flex flex-col h-full p-6 max-w-7xl mx-auto w-full overflow-y-auto">
      {/* Profile Header */}
      <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm mb-6">
        <CardContent className="p-8">
          <div className="flex items-center space-x-8">
            <Avatar className="w-28 h-28 border-4 border-amber-400/50">
              <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-red-600 text-white text-4xl">
                {currentUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="bg-zinc-900 border border-amber-500/30 rounded-lg px-4 py-2 text-white text-xl w-full"
                    placeholder="Nombre de usuario"
                  />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="bg-zinc-900 border border-amber-500/30 rounded-lg px-4 py-2 text-white w-full"
                    placeholder="Email"
                  />
                  <div className="flex space-x-3">
                    <Button size="sm" onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700 text-white">
                      <Check className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="border-red-500/50 text-red-400">
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <h2 className="text-white text-3xl font-bold">{currentUser.username}</h2>
                    {currentUser.isAdmin && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="text-amber-400 hover:text-amber-300">
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </div>
                  <p className="text-amber-300/70 text-base">{currentUser.email}</p>
                  <div className="flex items-center space-x-6 mt-3">
                    <span className="text-amber-400 text-lg font-semibold flex items-center">
                      <Trophy className="w-5 h-5 mr-2" /> ELO: {currentUser.elo}
                    </span>
                    <span className="text-green-400 text-lg font-semibold flex items-center">
                      <Coins className="w-5 h-5 mr-2" /> {currentUser.totalMoney.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black/40 border-amber-500/20">
          <CardContent className="p-5 text-center">
            <User className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white text-2xl font-bold">{currentUser.gamesPlayed}</p>
            <p className="text-white/60 text-sm">Partidas Jugadas</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-amber-500/20">
          <CardContent className="p-5 text-center">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-white text-2xl font-bold">{currentUser.gamesWon}</p>
            <p className="text-white/60 text-sm">Victorias</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-amber-500/20">
          <CardContent className="p-5 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white text-2xl font-bold">{winRate}%</p>
            <p className="text-white/60 text-sm">Ratio Victoria</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-amber-500/20">
          <CardContent className="p-5 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-white text-2xl font-bold">{currentUser.timePlayedHours}h</p>
            <p className="text-white/60 text-sm">Tiempo Jugado</p>
          </CardContent>
        </Card>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Flame className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{currentUser.currentStreak}</p>
              <p className="text-orange-300/80 text-sm">Racha Actual</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-500/30">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Award className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{currentUser.bestStreak}</p>
              <p className="text-amber-300/80 text-sm">Mejor Racha</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card className="bg-black/40 border-amber-500/20 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Award className="w-6 h-6 mr-2 text-amber-400" />
            Logros ({earnedAchievements.length}/{achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <p className="text-white/40 text-center py-6">Cargando logros...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`rounded-lg border p-4 flex items-center space-x-3 transition-all ${
                    achievement.earned 
                      ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                      : 'bg-black/30 border-white/10 text-white/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{achievement.name}</p>
                    <p className="text-xs opacity-70 truncate">{achievement.description}</p>
                    {achievement.earned && (
                      <p className="text-xs text-green-400 mt-1">+{achievement.rewardPts} pts</p>
                    )}
                  </div>
                  {achievement.earned && (
                    <Check className="w-5 h-5 text-green-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="bg-black/40 border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Lock className="w-6 h-6 mr-2 text-red-400" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Contraseña</p>
              <p className="text-white/50 text-sm">Última actualización desconocida</p>
            </div>
            <Button 
              variant="outline" 
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => setShowPasswordModal(true)}
            >
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPasswordModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-amber-400" /> Cambiar Contraseña
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-1">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button 
                  onClick={handleChangePassword} 
                  disabled={passwordLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {passwordLoading ? 'Cambiando...' : 'Confirmar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordModal(false)}
                  className="border-zinc-600 text-zinc-300"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
