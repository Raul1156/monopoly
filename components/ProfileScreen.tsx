import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { 
  User, 
  Trophy, 
  Clock, 
  Coins, 
  Gamepad2, 
  Target, 
  Crown,
  LogOut,
  Settings,
  Edit,
  ArrowLeft,
  Save,
  History,
  Award,
  TrendingUp,
  Bell,
  Shield,
  Lock,
  Trash2
} from 'lucide-react';
import type { User as UserType } from '../src/App.tsx';

interface ProfileScreenProps {
  user: UserType;
  onLogout: () => void;
}

type ProfileView = 'main' | 'edit' | 'achievements' | 'history' | 'stats' | 'settings';

export function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const [currentView, setCurrentView] = useState<ProfileView>('main');
  const [editedUsername, setEditedUsername] = useState(user.username);

  const stats = [
    {
      label: 'Partidas Jugadas',
      value: user.gamesPlayed.toString(),
      icon: Gamepad2,
      color: 'text-blue-400'
    },
    {
      label: 'Victorias',
      value: user.gamesWon.toString(),
      icon: Trophy,
      color: 'text-yellow-400'
    },
    {
      label: 'Dinero Total',
      value: `${user.totalMoney.toLocaleString()} pts`,
      icon: Coins,
      color: 'text-green-400'
    },
    {
      label: 'Tiempo Jugado',
      value: `${user.timePlayedHours}h`,
      icon: Clock,
      color: 'text-purple-400'
    },
    {
      label: 'Ratio Victoria',
      value: `${Math.round((user.gamesWon / user.gamesPlayed) * 100)}%`,
      icon: Target,
      color: 'text-red-400'
    },
    {
      label: 'Nivel Actual',
      value: user.level,
      icon: Crown,
      color: 'text-amber-400'
    }
  ];

  const achievements = [
    { name: 'Primera Victoria', description: 'Gana tu primera partida', earned: true, icon: '🏆', pts: 100 },
    { name: 'Millonario', description: 'Acumula 10,000 pts', earned: true, icon: '💰', pts: 500 },
    { name: 'Veterano', description: 'Juega 50 partidas', earned: false, icon: '⚔️', pts: 300 },
    { name: 'Maestro Casino', description: 'Gana 100 pts en casino', earned: true, icon: '🎰', pts: 200 },
    { name: 'Racha Ganadora', description: 'Gana 5 partidas seguidas', earned: false, icon: '🔥', pts: 400 },
    { name: 'Rey del Tablero', description: 'Completa 100 vueltas', earned: false, icon: '👑', pts: 1000 },
    { name: 'Coleccionista', description: 'Consigue todos los avatares', earned: false, icon: '🎨', pts: 800 },
    { name: 'Invencible', description: 'Gana 10 partidas sin perder', earned: false, icon: '⭐', pts: 1500 }
  ];

  const gameHistory = [
    { date: '22/10/2025 - 14:30', result: 'Victoria', pts: '+850', opponent: 'Ana García' },
    { date: '22/10/2025 - 12:15', result: 'Derrota', pts: '-320', opponent: 'Carlos Ruiz' },
    { date: '21/10/2025 - 19:45', result: 'Victoria', pts: '+1200', opponent: 'María López' },
    { date: '21/10/2025 - 17:20', result: 'Victoria', pts: '+950', opponent: 'Pedro Sánchez' },
    { date: '20/10/2025 - 21:00', result: 'Derrota', pts: '-450', opponent: 'Laura Martín' },
    { date: '20/10/2025 - 16:30', result: 'Victoria', pts: '+700', opponent: 'Jorge Díaz' }
  ];

  // Vista de Edición de Perfil
  if (currentView === 'edit') {
    return (
      <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentView('main')}
            className="text-white hover:text-amber-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <h2 className="text-white text-xl">Editar Perfil</h2>
          <div className="w-20" />
        </div>

        <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-24 h-24 border-4 border-amber-400">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-red-600 text-white text-2xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/20">
                Cambiar Avatar
              </Button>
            </div>

            <Separator className="bg-amber-500/20" />

            {/* Nombre de Usuario */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm">Nombre de Usuario</label>
              <Input
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="bg-white/10 border-amber-500/30 text-white placeholder:text-white/60 focus:border-amber-400"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm">Email</label>
              <Input
                type="email"
                defaultValue="raul@casinoytapas.com"
                className="bg-white/10 border-amber-500/30 text-white placeholder:text-white/60 focus:border-amber-400"
              />
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white"
              onClick={() => {
                alert('Perfil actualizado correctamente');
                setCurrentView('main');
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de Logros
  if (currentView === 'achievements') {
    return (
      <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentView('main')}
            className="text-white hover:text-amber-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <h2 className="text-white text-xl">Mis Logros</h2>
          <div className="w-20" />
        </div>

        <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Logros Desbloqueados</span>
              </CardTitle>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {achievements.filter(a => a.earned).length}/{achievements.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => (
              <div 
                key={index} 
                className={`flex items-center space-x-3 p-4 rounded-lg border ${
                  achievement.earned 
                    ? 'bg-amber-500/20 border-amber-400/50' 
                    : 'bg-black/20 border-white/10'
                }`}
              >
                <div className={`text-3xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`${achievement.earned ? 'text-white' : 'text-gray-400'}`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-xs ${achievement.earned ? 'text-amber-200' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Coins className={`w-3 h-3 ${achievement.earned ? 'text-green-400' : 'text-gray-500'}`} />
                    <span className={`text-xs ${achievement.earned ? 'text-green-400' : 'text-gray-500'}`}>
                      +{achievement.pts} pts
                    </span>
                  </div>
                </div>
                {achievement.earned && (
                  <Badge className="bg-green-500 text-white text-xs">
                    ✓
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de Historial
  if (currentView === 'history') {
    return (
      <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentView('main')}
            className="text-white hover:text-amber-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <h2 className="text-white text-xl">Historial</h2>
          <div className="w-20" />
        </div>

        <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Partidas Recientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gameHistory.map((game, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  game.result === 'Victoria' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-xs">{game.date}</span>
                  <Badge className={
                    game.result === 'Victoria'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }>
                    {game.result}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">vs {game.opponent}</span>
                  <span className={game.result === 'Victoria' ? 'text-green-400' : 'text-red-400'}>
                    {game.pts} pts
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }



  // Vista de Configuración del Perfil
  if (currentView === 'settings') {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentView('main')}
            className="text-white hover:text-amber-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <h2 className="text-white text-xl">Configuración del Perfil</h2>
          <div className="w-20" />
        </div>

        <div className="space-y-4">
          {/* Notificaciones del Perfil */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <span>Notificaciones del Perfil</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white text-sm">Nuevos Logros</p>
                    <p className="text-white/60 text-xs">Te avisamos cuando consigas logros</p>
                  </div>
                </div>
                <Switch
                  defaultChecked
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white text-sm">Subidas de Nivel</p>
                    <p className="text-white/60 text-xs">Notificación al subir de nivel</p>
                  </div>
                </div>
                <Switch
                  defaultChecked
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white text-sm">Posición en Ranking</p>
                    <p className="text-white/60 text-xs">Cambios en tu posición del ranking</p>
                  </div>
                </div>
                <Switch
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seguridad de la Cuenta */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>Seguridad de la Cuenta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <p className="text-white text-sm">Cambiar Contraseña</p>
                    <p className="text-white/60 text-xs">Actualiza tu contraseña de acceso</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-amber-400 rotate-180" />
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <p className="text-white text-sm">Verificación en Dos Pasos</p>
                    <p className="text-white/60 text-xs">Protege tu cuenta con 2FA</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Activo
                </Badge>
              </button>
            </CardContent>
          </Card>

          {/* Gestión de Datos */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-amber-400" />
                <span>Gestión de Datos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/30">
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <p className="text-red-400 text-sm">Eliminar Mi Cuenta</p>
                    <p className="text-red-300/60 text-xs">Acción permanente e irreversible</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-red-400 rotate-180" />
              </button>
            </CardContent>
          </Card>

          {/* Guardar Cambios */}
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white py-6"
            onClick={() => {
              alert('Configuración guardada correctamente');
              setCurrentView('main');
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Configuración
          </Button>
        </div>
      </div>
    );
  }

  // Vista Principal
  return (
    <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
      {/* Profile Header */}
      <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-20 h-20 border-4 border-amber-400">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-red-600 text-white text-2xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-white text-2xl">{user.username}</h2>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-amber-400 hover:bg-amber-500/20"
                  onClick={() => setCurrentView('edit')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <Badge className="bg-gradient-to-r from-amber-400 to-red-500 text-black mb-2">
                {user.level}
              </Badge>
              <p className="text-white/60 text-sm">
                Miembro desde octubre 2025
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
              onClick={() => setCurrentView('settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-500/30 text-red-300 hover:bg-red-500/20"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Detalladas */}
      <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span>Estadísticas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ELO */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">ELO Rating</p>
                <p className="text-white text-2xl">{user.elo}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-black/40 rounded-lg p-4 border border-amber-500/20">
                  <IconComponent className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-white text-lg">{stat.value}</p>
                  <p className="text-white/60 text-xs">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Racha Actual */}
          <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white">Racha Actual</span>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                🔥 5 victorias
              </Badge>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2">
              <div className="bg-gradient-to-r from-amber-400 to-red-500 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          {/* Mejor Racha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-white/60 text-xs">Mejor Racha</p>
              <p className="text-green-400 text-xl">12 victorias</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <p className="text-white/60 text-xs">Mayor Ganancia</p>
              <p className="text-blue-400 text-xl">2,500 pts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Options */}
      <div className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start bg-black/40 border-amber-500/20 text-white hover:bg-amber-500/20"
          onClick={() => setCurrentView('achievements')}
        >
          <Award className="w-5 h-5 mr-3 text-amber-400" />
          Mis Logros
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start bg-black/40 border-amber-500/20 text-white hover:bg-amber-500/20"
          onClick={() => setCurrentView('history')}
        >
          <History className="w-5 h-5 mr-3 text-blue-400" />
          Historial de Partidas
        </Button>
      </div>

      {/* Progress to Next Level */}
      <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-sm">Progreso al siguiente nivel</p>
            <p className="text-amber-300 text-sm">75%</p>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2">
            <div className="bg-gradient-to-r from-amber-400 to-red-500 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <p className="text-white/60 text-xs mt-2">5 victorias más para "Casino Royale"</p>
        </CardContent>
      </Card>
    </div>
  );
}
