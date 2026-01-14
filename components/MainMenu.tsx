 
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Play,
  ShoppingBag,
  Package,
  Crown,
  Coins,
  Star,
  Trophy
} from 'lucide-react';
import type { User as UserType } from '../src/services/apiService';
import type { Screen } from '../src/App.tsx';

interface MainMenuProps {
  user: UserType;
  onNavigate: (screen: Screen) => void;
}

export function MainMenu({ user, onNavigate }: MainMenuProps) {
  return (
    <div className="flex flex-col h-full p-6 max-w-7xl mx-auto w-full">
      {/* Header with User Info */}
      <div className="mb-8">
        <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <Avatar className="w-20 h-20 border-2 border-amber-400">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-red-600 text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-white text-2xl font-semibold">¡Hola, {user.username}!</h2>
                <div className="flex items-center space-x-2 text-amber-300 text-base mt-1">
                  <Crown className="w-5 h-5" />
                  <span>{user.level}</span>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center text-green-300">
                  <Coins className="w-5 h-5 mr-2" />
                  <span className="text-lg font-semibold">{user.totalMoney.toLocaleString()} pts</span>
                </div>
                <div className="flex items-center text-blue-300">
                  <Trophy className="w-5 h-5 mr-2" />
                  <span className="text-lg font-semibold">ELO: {user.elo}</span>
                </div>
                <div className="flex items-center text-amber-300">
                  <Star className="w-5 h-5 mr-2" />
                  <div>
                    <span className="text-lg font-semibold">{user.gamesWon}/{user.gamesPlayed}</span>
                    <p className="text-xs text-white/60">victorias</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Horizontal Layout */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Shop Card */}
          <Card 
            className="bg-gradient-to-br from-purple-900/70 to-pink-900/70 border-purple-400/30 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform duration-200 h-80"
            onClick={() => onNavigate('shop')}
          >
            <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-400/50">
                <ShoppingBag className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="text-white font-bold text-2xl mb-3">Tienda</h3>
              <p className="text-purple-300 text-lg mb-4">Nuevos items</p>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
              >
                Explorar →
              </Button>
            </CardContent>
          </Card>

          {/* Main Play Button - Central */}
          <Button
            onClick={() => onNavigate('monopoly')}
            className="h-80 bg-gradient-to-br from-red-600 via-amber-600 to-red-700 hover:from-red-700 hover:via-amber-700 hover:to-red-800 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-amber-400/50 rounded-3xl relative overflow-hidden"
          >
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1647102256335-7a7370d99924?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGVycmFuZWFuJTIwcGF0dGVybiUyMHRpbGVzJTIwc3BhbmlzaHxlbnwxfHx8fDE3NTk5Mjk2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080')] bg-cover bg-center"></div>
            
            <div className="relative flex flex-col items-center justify-center space-y-6">
              {/* Play icon with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-28 h-28 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/40 shadow-xl">
                  <Play className="w-14 h-14 text-white ml-1" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-wide text-amber-100 drop-shadow-lg">CASINO Y TAPAS</h2>
                <h3 className="text-6xl font-bold tracking-wider drop-shadow-2xl">JUGAR</h3>
              </div>
            </div>
          </Button>

          {/* Inventory Card */}
          <Card 
            className="bg-gradient-to-br from-blue-900/70 to-indigo-900/70 border-blue-400/30 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform duration-200 h-80"
            onClick={() => onNavigate('inventory')}
          >
            <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-blue-400/50">
                <Package className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-white font-bold text-2xl mb-3">Inventario</h3>
              <p className="text-blue-300 text-lg mb-4">Tus objetos</p>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
              >
                Ver todo →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Stats */}
      <Card className="bg-black/40 border-amber-500/20 mt-8 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-amber-300 text-sm mb-1">Tiempo jugado</p>
              <p className="text-white text-xl font-semibold">{user.timePlayedHours}h</p>
            </div>
            <div>
              <p className="text-green-300 text-sm mb-1">Ratio victoria</p>
              <p className="text-white text-xl font-semibold">{Math.round((user.gamesWon / user.gamesPlayed) * 100)}%</p>
            </div>
            <div>
              <p className="text-blue-300 text-sm mb-1">Partidas</p>
              <p className="text-white text-xl font-semibold">{user.gamesPlayed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
