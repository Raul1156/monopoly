import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Gift, 
  Coins, 
  CheckCircle2,
  Gamepad2,
  LogIn,
  Loader2
} from 'lucide-react';
import { apiService, type DailyReward, type User } from '../src/services/apiService';
import { toast } from 'sonner';

interface EventosScreenProps {
  currentUser: User;
  onUserUpdate?: (user: User) => void;
}

export function EventosScreen({ currentUser, onUserUpdate }: EventosScreenProps) {
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    apiService.getDailyRewards(currentUser.id)
      .then((data) => {
        if (mounted) setRewards(data);
      })
      .catch((err) => {
        console.error('Error loading daily rewards:', err);
        if (mounted) setRewards([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser.id]);

  const handleClaimReward = async (rewardId: number) => {
    setClaimingId(rewardId);
    try {
      const result = await apiService.claimReward(rewardId, currentUser.id);
      toast.success(result.message);
      
      // Update the reward as claimed
      setRewards(prev => prev.map(r => r.id === rewardId ? { ...r, claimed: true } : r));
      
      // Update user balance
      if (onUserUpdate) {
        const updated = await apiService.getUser(currentUser.id);
        onUserUpdate(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reclamar recompensa';
      toast.error(msg);
    } finally {
      setClaimingId(null);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'diaria': return <LogIn className="w-6 h-6 text-amber-400" />;
      case 'partida': return <Gamepad2 className="w-6 h-6 text-purple-400" />;
      default: return <Gift className="w-6 h-6 text-green-400" />;
    }
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'diaria': return { card: 'from-amber-500/20 to-red-500/20', border: 'border-amber-500/40', accent: 'text-amber-400', btn: 'from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700' };
      case 'partida': return { card: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40', accent: 'text-purple-400', btn: 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' };
      default: return { card: 'from-green-500/20 to-teal-500/20', border: 'border-green-500/40', accent: 'text-green-400', btn: 'from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 p-4 flex flex-col pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Eventos Diarios</h1>
        <p className="text-amber-300 text-sm">Conecta y juega para ganar recompensas</p>
        <div className="flex items-center mt-2 text-green-400">
          <Coins className="w-4 h-4 mr-1" />
          <span className="text-sm font-semibold">Tu saldo: {currentUser.totalMoney.toLocaleString()} pts</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-white/60 ml-3">Cargando recompensas...</span>
        </div>
      )}

      {!loading && rewards.length === 0 && (
        <Card className="bg-black/40 border-amber-500/20">
          <CardContent className="p-8 text-center">
            <Gift className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No hay recompensas disponibles</p>
          </CardContent>
        </Card>
      )}

      {/* Reward Cards */}
      {rewards.map((reward) => {
        const colors = getRewardColor(reward.type);
        return (
          <Card key={reward.id} className={`bg-gradient-to-br ${colors.card} ${colors.border} backdrop-blur-sm mb-4`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-white">
                {getRewardIcon(reward.type)}
                <span className="ml-2">{reward.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-white/80 text-sm mb-3">
                  {reward.description}
                </p>
                <div className="bg-black/30 rounded-lg p-4 border border-amber-500/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${colors.accent.replace('text-', 'bg-').replace('400', '500/20')} rounded-full flex items-center justify-center`}>
                        {getRewardIcon(reward.type)}
                      </div>
                      <div>
                        <h3 className="text-white">{reward.name}</h3>
                        <div className="flex items-center space-x-1 text-green-400">
                          <Coins className="w-4 h-4" />
                          <span>+{reward.moneyReward} pts</span>
                        </div>
                      </div>
                    </div>
                    {reward.claimed && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Reclamado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {!reward.claimed ? (
                <Button
                  onClick={() => handleClaimReward(reward.id)}
                  disabled={claimingId === reward.id}
                  className={`w-full bg-gradient-to-r ${colors.btn} text-white`}
                >
                  {claimingId === reward.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reclamando...</>
                  ) : (
                    <><Gift className="w-4 h-4 mr-2" /> Reclamar Recompensa</>
                  )}
                </Button>
              ) : (
                <div className="text-center py-2 text-amber-300 text-sm">
                  ¡Vuelve mañana para otra recompensa!
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
