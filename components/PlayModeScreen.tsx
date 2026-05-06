import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Crown, Users, ArrowLeft } from 'lucide-react';
import type { Screen } from '../src/App';
import { apiService } from '../src/services/apiService';
import { toast } from 'sonner';

interface PlayModeScreenProps {
  onNavigate: (screen: Screen) => void;
  userId: number;
  onJoinLobby: (code: string) => void;
}

export function PlayModeScreen({ onNavigate, userId, onJoinLobby }: PlayModeScreenProps) {
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateLobby = async () => {
    setIsCreating(true);
    try {
      const lobby = await apiService.createLobby(userId, maxPlayers);
      onJoinLobby(lobby.code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear partida');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!joinCode || joinCode.length !== 6) {
      toast.error('El código debe tener 6 caracteres');
      return;
    }

    setIsJoining(true);
    try {
      const lobby = await apiService.joinLobby(joinCode.toUpperCase(), userId);
      onJoinLobby(lobby.code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al unirse a la partida');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => onNavigate('menu')}
          className="text-amber-400 hover:text-amber-300 hover:bg-black/20"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al Menú
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Create Game Card */}
          <Card className="bg-gradient-to-br from-red-900/80 to-amber-900/80 border-amber-500/30 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
            <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-red-600 rounded-full flex items-center justify-center mb-6 border-4 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Crear Partida</h2>
              <p className="text-amber-200/80 mb-8">Conviértete en el Host y juega con tus amigos</p>
              
              <div className="w-full space-y-4">
                <div>
                  <label className="text-sm text-amber-200/80 mb-2 block">Número máximo de jugadores</label>
                  <div className="flex justify-center space-x-4">
                    {[2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setMaxPlayers(num)}
                        className={`w-12 h-12 rounded-full border-2 font-bold text-lg transition-all ${
                          maxPlayers === num 
                            ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
                            : 'bg-black/40 border-amber-500/30 text-amber-500 hover:border-amber-400/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleCreateLobby}
                  disabled={isCreating}
                  className="w-full h-14 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isCreating ? 'Creando...' : 'Crear Sala'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Game Card */}
          <Card className="bg-gradient-to-br from-blue-900/80 to-cyan-900/80 border-cyan-500/30 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
            <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mb-6 border-4 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Unirse a Partida</h2>
              <p className="text-cyan-200/80 mb-8">Ingresa el código que te compartieron</p>
              
              <div className="w-full space-y-6">
                <div>
                  <label className="text-sm text-cyan-200/80 mb-2 block">Código de la sala</label>
                  <Input 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    placeholder="Ej. A1B2C3"
                    className="h-14 text-center text-2xl font-bold tracking-widest uppercase bg-black/40 border-cyan-500/50 text-white placeholder:text-white/20 focus:border-cyan-400 focus:ring-cyan-400/50"
                  />
                </div>

                <Button 
                  onClick={handleJoinLobby}
                  disabled={isJoining || joinCode.length !== 6}
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? 'Conectando...' : 'Unirse a la Sala'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
