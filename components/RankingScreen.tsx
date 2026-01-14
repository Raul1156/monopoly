import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import type { User as UserType } from '../src/App.tsx';

interface RankingScreenProps {
  currentUser: UserType;
}

interface RankingUser {
  id: string;
  username: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  totalMoney: number;
  elo: number;
  level: string;
  rank: number;
}

export function RankingScreen({ currentUser }: RankingScreenProps) {
  // Mock ranking data
  const [rankings] = useState<RankingUser[]>([
    {
      id: '1',
      username: 'ElMatador',
      avatar: 'https://images.unsplash.com/photo-1760456310233-cc3b9314caf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5ZWxsb3clMjB0b3klMjBjaGFyYWN0ZXJ8ZW58MXx8fHwxNzYwNjI4NDMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      gamesPlayed: 156,
      gamesWon: 98,
      totalMoney: 45230,
      elo: 2850,
      level: 'Gran Maestro',
      rank: 1
    },
    {
      id: '2',
      username: 'LaSevillana',
      avatar: 'https://images.unsplash.com/photo-1758555225970-5167a1a8d697?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwdG95JTIwY2hhcmFjdGVyfGVufDF8fHx8MTc2MDYyODQzMXww&ixlib=rb-4.1.0&q=80&w=1080',
      gamesPlayed: 142,
      gamesWon: 89,
      totalMoney: 38650,
      elo: 2720,
      level: 'Casino Royale',
      rank: 2
    },
    {
      id: '3',
      username: 'DonQuijote',
      avatar: 'https://images.unsplash.com/photo-1760007416357-76c955bc713a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwdG95JTIwY2hhcmFjdGVyfGVufDF8fHx8MTc2MDYyODQzMnww&ixlib=rb-4.1.0&q=80&w=1080',
      gamesPlayed: 98,
      gamesWon: 67,
      totalMoney: 32100,
      elo: 2580,
      level: 'Magnate',
      rank: 3
    },
    {
      id: '4',
      username: currentUser.username,
      avatar: currentUser.avatar,
      gamesPlayed: currentUser.gamesPlayed,
      gamesWon: currentUser.gamesWon,
      totalMoney: currentUser.totalMoney,
      elo: currentUser.elo,
      level: currentUser.level,
      rank: 4
    },
    {
      id: '5',
      username: 'Flamenco95',
      avatar: 'https://images.unsplash.com/photo-1760158490392-b97ccf0c9e14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHRveSUyMGNoYXJhY3RlcnxlbnwxfHx8fDE3NjA2Mjg0MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      gamesPlayed: 76,
      gamesWon: 41,
      totalMoney: 12800,
      elo: 2180,
      level: 'Croupier',
      rank: 5
    },
    {
      id: '6',
      username: 'Paella_King',
      avatar: 'https://images.unsplash.com/photo-1759663174000-49ad3b40b457?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjB0b3klMjBjaGFyYWN0ZXJ8ZW58MXx8fHwxNzYwNjI4NDMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      gamesPlayed: 54,
      gamesWon: 28,
      totalMoney: 9450,
      elo: 1920,
      level: 'Tapa Master',
      rank: 6
    }
  ]);

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
        {rankings.map((user) => (
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
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRankColor(user.rank)} flex items-center justify-center shadow-lg`}>
                  {user.rank <= 3 ? (
                    getRankIcon(user.rank)
                  ) : (
                    <span className="text-white text-xl font-bold">{user.rank}</span>
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
                    {Math.round((user.gamesWon / user.gamesPlayed) * 100)}% victorias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Stats */}
      <div className="mt-8">
        <Card className="bg-black/40 border-amber-500/20">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-amber-300 text-sm mb-1">Tu posición</p>
                <p className="text-white text-2xl font-semibold">#{currentUser.id === '4' ? '4' : 'N/A'}</p>
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
