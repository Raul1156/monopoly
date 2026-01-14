 
import { Button } from './ui/button';
import { 
  Home, 
  Trophy, 
  User, 
  Calendar,
  Settings
} from 'lucide-react';
import type { Screen } from '../src/App.tsx';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const navItems = [
    {
      id: 'menu' as Screen,
      icon: Home,
      label: 'Inicio'
    },
    {
      id: 'settings' as Screen,
      icon: Settings,
      label: 'Ajustes'
    },
    {
      id: 'events' as Screen,
      icon: Calendar,
      label: 'Eventos'
    },
    {
      id: 'ranking' as Screen,
      icon: Trophy,
      label: 'Ranking'
    },
    {
      id: 'profile' as Screen,
      icon: User,
      label: 'Perfil'
    }
  ];

  return (
    <div className="bg-black/80 backdrop-blur-sm border-t border-amber-500/30 p-2">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center space-y-1 h-auto py-2 transition-all duration-200 ${
                isActive 
                  ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
