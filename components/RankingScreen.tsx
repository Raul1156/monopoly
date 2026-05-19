import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import { apiService, type User as UserType } from '../src/services/apiService';

interface RankingScreenProps {
  currentUser: UserType;
}

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

// Reusable component for displaying a user row
const UserRankingCard = ({ user, rank, isCurrentUser, isPinned = false }: { user: UserType, rank: number, isCurrentUser: boolean, isPinned?: boolean }) => (
  <Card
    className={`border-amber-500/20 backdrop-blur-sm transition-all duration-200 ${
      isCurrentUser 
        ? 'bg-amber-500/20 border-amber-400/50 scale-[1.02] shadow-lg shadow-amber-500/10' 
        : 'bg-black/40 hover:bg-black/50'
    } ${isPinned ? 'border-amber-400/80 bg-black/80 shadow-2xl z-10' : ''}`}
  >
    <CardContent className="p-6">
      <div className="flex items-center space-x-6">
        {/* Rank */}
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center shadow-lg shrink-0`}>
          {rank > 0 && rank <= 3 ? (
            getRankIcon(rank)
          ) : (
            <span className="text-white text-xl font-bold">{rank > 0 ? rank : '-'}</span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="w-16 h-16 border-2 border-amber-400/50 shrink-0">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-red-600 text-white text-xl">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-white text-xl font-semibold truncate">{user.username}</h3>
            {isCurrentUser && (
              <Badge className="bg-amber-500 text-black whitespace-nowrap">TÚ</Badge>
            )}
            {isPinned && !isCurrentUser && (
              <Badge className="bg-blue-500 text-white whitespace-nowrap">FIJADO</Badge>
            )}
          </div>
          <p className="text-amber-300 text-base mt-1 truncate">{user.gamesWon} victorias / {user.gamesPlayed} partidas</p>
          <div className="flex flex-wrap gap-4 text-sm text-white/60 mt-2">
            <span>{user.gamesPlayed} partidas</span>
            <span>{user.gamesWon} victorias</span>
            <span>{user.totalMoney?.toLocaleString() || 0} pts</span>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
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

export function RankingScreen({ currentUser }: RankingScreenProps) {
  const [rankings, setRankings] = useState<UserType[]>([]);

  useEffect(() => {
    let mounted = true;
    apiService.getTopPlayers(0) // 0 fetches all users
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

  const currentUserIndex = rankings.findIndex(u => u.id === currentUser.id);
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : 0;
  const currentUserData = currentUserIndex >= 0 ? rankings[currentUserIndex] : currentUser;

  return (
    <div className="flex flex-col h-full p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 shrink-0">
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
      <div className="flex-1 space-y-4 overflow-y-auto min-h-0 mb-6 pr-2">
        {rankings.map((user, index) => (
          <UserRankingCard
            key={user.id}
            user={user}
            rank={index + 1}
            isCurrentUser={user.id === currentUser.id}
          />
        ))}
        {rankings.length === 0 && (
          <div className="text-center text-white/60 py-10">Cargando ranking...</div>
        )}
      </div>

      {/* Pinned Current User Stats */}
      <div className="shrink-0 pt-4 border-t border-amber-500/30">
        <div className="flex items-center space-x-2 text-amber-400 mb-3 pl-1">
          <Star className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Tu posición actual</h3>
        </div>
        <UserRankingCard
          user={currentUserData}
          rank={currentUserRank}
          isCurrentUser={true}
          isPinned={true}
        />
      </div>
    </div>
  );
}
