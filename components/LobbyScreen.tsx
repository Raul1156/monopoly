import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Users, Copy, ArrowLeft, Loader2, Play } from 'lucide-react';
import { apiService, type LobbyInfo, type LobbyPlayer } from '../src/services/apiService';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { getHubUrl } from '../src/services/urlResolver';
import { toast } from 'sonner';

interface LobbyScreenProps {
  lobbyCode: string;
  userId: number;
  onBack: () => void;
  onGameStarted: (gameId: number) => void;
}

export function LobbyScreen({ lobbyCode, userId, onBack, onGameStarted }: LobbyScreenProps) {
  const [lobby, setLobby] = useState<LobbyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [connection, setConnection] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    let newConnection: any = null;

    const setupLobby = async () => {
      try {
        // Fetch initial lobby state
        const lobbyData = await apiService.getLobby(lobbyCode);
        if (!isMounted) return;
        setLobby(lobbyData);

        // Setup SignalR
        newConnection = new HubConnectionBuilder()
          .withUrl(getHubUrl())
          .withAutomaticReconnect()
          .build();

        newConnection.on('PlayerJoinedLobby', (updatedLobby: LobbyInfo) => {
          setLobby(updatedLobby);
          const newPlayer = updatedLobby.players[updatedLobby.players.length - 1];
          if (newPlayer.userId !== userId) {
            toast.success(`${newPlayer.username} se ha unido`);
          }
        });

        newConnection.on('PlayerLeftLobby', (updatedLobby: LobbyInfo) => {
          setLobby(updatedLobby);
        });

        newConnection.on('GameStarted', (gameId: number) => {
          toast.success('¡La partida ha empezado!');
          onGameStarted(gameId);
        });

        newConnection.on('LobbyCancelled', () => {
          toast.error('El host ha cancelado la partida');
          onBack();
        });

        await newConnection.start();
        await newConnection.invoke('JoinLobby', lobbyCode);
        
        if (isMounted) {
          setConnection(newConnection);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in lobby setup:', error);
        toast.error('Error al conectar con la sala');
        onBack();
      }
    };

    setupLobby();

    return () => {
      isMounted = false;
      if (newConnection) {
        newConnection.invoke('LeaveLobby', lobbyCode)
          .catch(console.error)
          .finally(() => newConnection.stop());
      }
    };
  }, [lobbyCode, userId, onBack, onGameStarted]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    toast.success('Código copiado al portapapeles');
  };

  const handleLeaveLobby = async () => {
    try {
      await apiService.leaveLobby(lobbyCode, userId);
      onBack();
    } catch (error) {
      toast.error('Error al abandonar la sala');
    }
  };

  const handleStartGame = async () => {
    if (!lobby || lobby.players.length < 2) return;
    
    setIsStarting(true);
    try {
      await apiService.startLobby(lobbyCode, userId);
      // The GameStarted event will handle the navigation for all players
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar la partida');
      setIsStarting(false);
    }
  };

  if (isLoading || !lobby) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-amber-200 text-lg">Conectando a la sala...</p>
      </div>
    );
  }

  const isHost = lobby.hostUserId === userId;
  const canStart = isHost && lobby.players.length >= 2;

  // Create array of empty slots based on max players
  const emptySlots = Array(Math.max(0, lobby.maxPlayers - lobby.players.length)).fill(null);

  return (
    <div className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="ghost" 
          onClick={handleLeaveLobby}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Abandonar Sala
        </Button>

        <div className="flex items-center bg-black/40 border border-amber-500/30 rounded-full px-6 py-2">
          <span className="text-amber-200/60 mr-4">Código de Sala:</span>
          <span className="text-2xl font-bold text-amber-400 tracking-widest">{lobbyCode}</span>
          <button 
            onClick={handleCopyCode}
            className="ml-4 text-amber-400 hover:text-amber-300 transition-colors p-2 hover:bg-white/5 rounded-full"
            title="Copiar código"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Card className="bg-black/60 border-amber-500/30 backdrop-blur-md flex-1">
        <CardContent className="p-8">
          <div className="flex items-center justify-center mb-10">
            <Users className="w-8 h-8 text-amber-400 mr-3" />
            <h2 className="text-3xl font-bold text-white">
              Jugadores ({lobby.players.length}/{lobby.maxPlayers})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {lobby.players.map((player) => (
              <div 
                key={player.userId}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center space-x-4 relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${player.color}`}></div>
                
                <div className="w-14 h-14 rounded-full bg-black/50 border-2 border-white/20 overflow-hidden flex-shrink-0">
                  <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    {player.username}
                    {player.userId === userId && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Tú</span>}
                  </h3>
                  {player.isHost && (
                    <span className="text-sm text-amber-400 font-medium flex items-center mt-1">
                      👑 Host de la sala
                    </span>
                  )}
                </div>
              </div>
            ))}

            {emptySlots.map((_, index) => (
              <div 
                key={`empty-${index}`}
                className="bg-white/5 border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center h-[90px]"
              >
                <p className="text-white/30 font-medium">Esperando jugador...</p>
              </div>
            ))}
          </div>

          {isHost ? (
            <div className="flex flex-col items-center">
              <Button
                onClick={handleStartGame}
                disabled={!canStart || isStarting}
                className={`w-full max-w-md h-16 text-xl font-bold rounded-xl shadow-lg transition-all ${
                  canStart && !isStarting
                    ? 'bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isStarting ? (
                  <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Iniciando...</>
                ) : (
                  <><Play className="w-6 h-6 mr-3" /> {canStart ? 'Iniciar Partida' : 'Esperando más jugadores...'}</>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center p-6 bg-black/30 rounded-xl border border-white/10 max-w-md mx-auto">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-amber-200">Esperando a que el host inicie la partida...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
