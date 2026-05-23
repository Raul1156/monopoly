import { useState } from 'react';
import { Toaster } from 'sonner';
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
import { PlayModeScreen } from '../components/PlayModeScreen';
import { LobbyScreen } from '../components/LobbyScreen';
import { AdminScreen } from '../components/AdminScreen';
import { apiService, type User } from './services/apiService';

export type Screen = 'login' | 'menu' | 'ranking' | 'profile' | 'events' | 'monopoly' | 'shop' | 'inventory' | 'settings' | 'playmode' | 'lobby' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

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
      setCurrentScreen(user.isAdmin ? 'admin' : 'menu');
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

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  return (
    <>
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

      <div className="flex-1 relative z-10">
        {currentScreen === 'menu' && (
          <MainMenu user={currentUser} onNavigate={navigateToScreen} />
        )}
        {currentScreen === 'ranking' && (
          <RankingScreen currentUser={currentUser} />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen currentUser={currentUser} onUserUpdate={handleUserUpdate} />
        )}
        {currentScreen === 'events' && (
          <EventosScreen currentUser={currentUser} onUserUpdate={handleUserUpdate} />
        )}
        {currentScreen === 'playmode' && currentUser && (
          <PlayModeScreen 
            onNavigate={navigateToScreen} 
            userId={currentUser.id} 
            onJoinLobby={(code) => {
              setLobbyCode(code);
              setCurrentScreen('lobby');
            }} 
          />
        )}
        {currentScreen === 'lobby' && currentUser && lobbyCode && (
          <LobbyScreen 
            lobbyCode={lobbyCode} 
            userId={currentUser.id} 
            onBack={() => setCurrentScreen('playmode')}
            onGameStarted={(gameId) => {
              setActiveGameId(gameId);
              setCurrentScreen('monopoly');
            }}
          />
        )}
        {currentScreen === 'monopoly' && currentUser && activeGameId && (
          <MonopolyScreen 
            onNavigate={navigateToScreen} 
            currentUser={currentUser}
            gameId={activeGameId}
            onUserUpdate={handleUserUpdate}
          />
        )}
        {currentScreen === 'shop' && (
          <ShopScreen onNavigate={navigateToScreen} currentUser={currentUser} onUserUpdate={handleUserUpdate} />
        )}
        {currentScreen === 'inventory' && (
          <InventoryScreen onNavigate={navigateToScreen} currentUser={currentUser} onUserUpdate={handleUserUpdate} />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen onNavigate={navigateToScreen} onLogout={handleLogout} />
        )}
        {currentScreen === 'admin' && (
          <AdminScreen currentUser={currentUser} onLogout={handleLogout} />
        )}
      </div>

      {currentScreen !== 'login' && !['shop', 'inventory', 'monopoly', 'playmode', 'lobby', 'admin'].includes(currentScreen) && (
        <Navigation currentScreen={currentScreen} onNavigate={navigateToScreen} />
      )}
    </div>
    <Toaster position="top-center" richColors />
    </>
  );
}
