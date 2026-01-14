import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Gift, 
  Coins, 
  CheckCircle2,
  Gamepad2,
  LogIn
} from 'lucide-react';

export function EventosScreen() {
  const [loginRewardClaimed, setLoginRewardClaimed] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  const handleClaimLoginReward = () => {
    setLoginRewardClaimed(true);
    alert('¡Bienvenido! Has recibido 200 pts por conectarte hoy');
  };

  const handlePlayGame = () => {
    setGamesPlayed(prev => prev + 1);
    alert(`¡Partida completada! Has recibido 150 pts. Total de partidas jugadas hoy: ${gamesPlayed + 1}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 p-4 flex flex-col pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-2xl">Eventos Diarios</h1>
        <p className="text-amber-300 text-sm">Conecta y juega para ganar recompensas</p>
      </div>

      {/* Recompensa por Conexión */}
      <Card className="bg-gradient-to-br from-amber-500/20 to-red-500/20 border-amber-500/40 backdrop-blur-sm mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-white">
            <LogIn className="w-5 h-5 mr-2 text-amber-400" />
            Recompensa de Conexión Diaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-white/80 text-sm mb-3">
              Cada vez que te conectas, recibes una recompensa especial
            </p>
            <div className="bg-black/30 rounded-lg p-4 border border-amber-500/30 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white">Bono de Conexión</h3>
                    <div className="flex items-center space-x-1 text-green-400">
                      <Coins className="w-4 h-4" />
                      <span>+200 pts</span>
                    </div>
                  </div>
                </div>
                {loginRewardClaimed && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Reclamado
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {!loginRewardClaimed ? (
            <Button
              onClick={handleClaimLoginReward}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
            >
              <Gift className="w-4 h-4 mr-2" />
              Reclamar Recompensa
            </Button>
          ) : (
            <div className="text-center py-2 text-amber-300 text-sm">
              ¡Vuelve mañana para otra recompensa!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recompensa por Partida */}
      <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/40 backdrop-blur-sm mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-white">
            <Gamepad2 className="w-5 h-5 mr-2 text-purple-400" />
            Recompensa por Partida Jugada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-white/80 text-sm mb-3">
              Cada partida que juegues te otorga puntos adicionales
            </p>
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/30 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white">Por Partida Completada</h3>
                    <div className="flex items-center space-x-1 text-green-400">
                      <Coins className="w-4 h-4" />
                      <span>+150 pts</span>
                    </div>
                  </div>
                </div>
                {gamesPlayed > 0 && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {gamesPlayed} jugadas
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            onClick={handlePlayGame}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
          >
            <Gamepad2 className="w-4 h-4 mr-2" />
            Reclamar Recompensa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
