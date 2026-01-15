import { useState } from 'react';
import { LoginScreen } from '../components/LoginScreen';
import { MainMenu } from '../components/MainMenu';
import { RankingScreen } from '../components/RankingScreen';
import { ProfileScreen } from '../components/ProfileScreen';
import { EventosScreen } from '../components/EventosScreen';
import { MonopolyScreen } from '../components/MonopolyScreen';
import { ShopScreen } from '../components/ShopScreen';
import { InventoryScreen } from '../components/InventoryScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { Navigation } from '../components/Navigation';
import { apiService, type User } from './services/apiService';

export type Screen = 'login' | 'menu' | 'ranking' | 'profile' | 'events' | 'monopoly' | 'shop' | 'inventory' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleAuth = async (params: { mode: 'login' | 'register'; username: string; password: string; email?: string }) => {
    try {
      const user = params.mode === 'register'
        ? await apiService.register({
            username: params.username,
            email: params.email || '',
            password: params.password,
          })
        : await apiService.login({
            username: params.username,
            password: params.password,
          });
      setCurrentUser(user);
      setIsLoggedIn(true);
      setCurrentScreen('menu');
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 flex flex-col w-full relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1647102256335-7a7370d99924?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGVycmFuZWFuJTIwcGF0dGVybiUyMHRpbGVzJTIwc3BhbmlzaHxlbnwxfHx8fDE3NTk5Mjk2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Banner temporal para verificar Tailwind (eliminado en producción) */}
      
      <div className="flex-1 relative z-10">
        {currentScreen === 'menu' && (
          <MainMenu user={currentUser} onNavigate={navigateToScreen} />
        )}
        {currentScreen === 'ranking' && (
          <RankingScreen currentUser={currentUser} />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen user={currentUser} onLogout={handleLogout} />
        )}
        {currentScreen === 'events' && (
          <EventosScreen />
        )}
        {currentScreen === 'monopoly' && (
          <MonopolyScreen onNavigate={navigateToScreen} />
        )}
        {currentScreen === 'shop' && (
          <ShopScreen onNavigate={navigateToScreen} currentUser={currentUser} />
        )}
        {currentScreen === 'inventory' && (
          <InventoryScreen onNavigate={navigateToScreen} currentUser={currentUser} />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen onNavigate={navigateToScreen} onLogout={handleLogout} />
        )}
      </div>

      {currentScreen !== 'login' && !['shop', 'inventory', 'monopoly'].includes(currentScreen) && (
        <Navigation currentScreen={currentScreen} onNavigate={navigateToScreen} />
      )}
    </div>
  );
}
