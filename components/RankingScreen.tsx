import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import { apiService, type User as UserType } from '../src/services/apiService';

interface RankingScreenProps {
  currentUser: UserType;
}

export function RankingScreen({ currentUser }: RankingScreenProps) {
  const [rankings, setRankings] = useState<UserType[]>([]);

  useEffect(() => {
    let mounted = true;
    apiService.getTopPlayers(10)
      .then((data) => {
        if (mounted) setRankings(data);
      })
      .catch((err) => {
        console.error('Error loading rankings:', err);
        if (mounted) setRankings([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Trophy className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-amber-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-amber-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-600 to-orange-500';
      default:
        return 'from-amber-500/20 to-red-500/20';
    }
  };



  return (
    <div className="flex flex-col h-full p-6 max-w-7xl mx-auto w-full">
      {/** Derived values */}
      
      {/* Header */}
      <div className="mb-8">
        <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center space-x-3 text-3xl">
              <Trophy className="w-8 h-8 text-amber-400" />
              <span>Ranking Global por ELO</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rankings List */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {rankings.map((user, index) => {
          const rank = index + 1;
          return (
          <Card
            key={user.id}
            className={`border-amber-500/20 backdrop-blur-sm transition-all duration-200 ${
              user.id === currentUser.id 
                ? 'bg-amber-500/20 border-amber-400/50 scale-[1.02]' 
                : 'bg-black/40 hover:bg-black/50'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                {/* Rank */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center shadow-lg`}>
                  {rank <= 3 ? (
                    getRankIcon(rank)
                  ) : (
                    <span className="text-white text-xl font-bold">{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="w-16 h-16 border-2 border-amber-400/50">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-red-600 text-white text-xl">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-white text-xl font-semibold">{user.username}</h3>
                    {user.id === currentUser.id && (
                      <Badge className="bg-amber-500 text-black">TÚ</Badge>
                    )}
                  </div>
                  <p className="text-amber-300 text-base mt-1">{user.level}</p>
                  <div className="flex space-x-6 text-sm text-white/60 mt-2">
                    <span>{user.gamesPlayed} partidas</span>
                    <span>{user.gamesWon} victorias</span>
                    <span>{user.totalMoney.toLocaleString()} pts</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="text-purple-300 text-3xl font-bold">{user.elo}</p>
                  <p className="text-white/60 text-sm">ELO</p>
                  <p className="text-white/60 text-sm mt-2">
                    {user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0}% victorias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>

      {/* Bottom Stats */}
      <div className="mt-8">
        <Card className="bg-black/40 border-amber-500/20">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-amber-300 text-sm mb-1">Tu posición</p>
                <p className="text-white text-2xl font-semibold">
                  {(() => {
                    const idx = rankings.findIndex(u => u.id === currentUser.id);
                    return idx >= 0 ? `#${idx + 1}` : 'N/A';
                  })()}
                </p>
              </div>
              <div>
                <p className="text-green-300 text-sm mb-1">Total jugadores</p>
                <p className="text-white text-2xl font-semibold">{rankings.length * 100}+</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
