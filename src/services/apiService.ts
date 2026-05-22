import { getApiBaseUrl } from './urlResolver';

const API_BASE_URL = getApiBaseUrl();

// Types matching backend DTOs
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  totalMoney: number;
  timePlayedHours: number;
  elo: number;
  currentStreak: number;
  bestStreak: number;
  isAdmin: boolean;
}

export interface LoginRequest {
  username: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateGameRequest {
  name: string;
  maxPlayers: number;
}

export interface LobbyInfo {
  gameId: number;
  code: string;
  status: string;
  maxPlayers: number;
  hostUserId: number;
  players: LobbyPlayer[];
}

export interface LobbyPlayer {
  userId: number;
  username: string;
  avatar: string;
  color: string;
  order: number;
  isHost: boolean;
}

export interface Game {
  id: number;
  name: string;
  status: string;
  currentTurn: number;
  players: PlayerInGame[];
}

export interface PlayerInGame {
  id: number;
  userId: number;
  username: string;
  money: number;
  position: number;
  isInJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  isBankrupt: boolean;
  turnOrder: number;
  token: string;
  ownedProperties: PropertyOwnership[];
}

export interface PropertyOwnership {
  propertyId: number;
  propertyName: string;
  houses: number;
  hasHotel: boolean;
  isMortgaged: boolean;
}

export interface DiceRoll {
  dice1: number;
  dice2: number;
  total: number;
  isDouble: boolean;
}

export interface MoveResult {
  newPosition: number;
  spaceName: string;
  spaceType: string;
  diceRoll: DiceRoll;
  passedGo: boolean;
  moneyChange: number;
  message: string;
}

export interface PropertyUpgradeInfo {
  propertyId: number;
  ownerId: number;
  level: number;
}

export interface TradeProperty {
  propertyId: number;
  releaseMortgageNow: boolean;
}

export interface TradeRequest {
  gameId: number;
  fromPlayerId: number;
  toPlayerId: number;
  cashFrom: number;
  cashTo: number;
  propertiesFrom: TradeProperty[];
  propertiesTo: TradeProperty[];
}

export interface TradeResult {
  message: string;
  fromPlayerMoney: number;
  toPlayerMoney: number;
  transferredFromPropertyIds: number[];
  transferredToPropertyIds: number[];
}

export interface Property {
  id: number;
  name: string;
  type: string;
  price: number;
  rentBase: number;
  rentLevel1?: number;
  rentLevel2?: number;
  rentLevel3?: number;
  rentLevel4?: number;
  rentHotel?: number;
  upgradePrice?: number;
  color: string;
  position: number;
}

export interface BoardSpace {
  id: number;
  name: string;
  position: number;
  type: string;
  description?: string;
  propertyId?: number;
  property?: Property;
  actionAmount?: number;
}

export interface Card {
  id: number;
  type: string; // COMUNIDAD | SUERTE
  description: string;
  effect: string; // ganar_dinero | perder_dinero | cobrar_jugadores | pagar_jugadores
  value: number;
}

export interface CardDraw {
  card: Card;
}

export interface ShopProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: 'pts';
  category: 'avatar' | 'theme';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
}

export interface InventoryItem {
  productId: number;
  name: string;
  description: string;
  category: 'themes';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
  equipped: boolean;
  quantity: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rewardPts: number;
  earned: boolean;
  earnedAt?: string;
}

export interface DailyReward {
  id: number;
  name: string;
  description: string;
  type: string;
  moneyReward: number;
  claimed: boolean;
}

// API Service
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'API request failed');
    }

    return response.json();
  }

  // User endpoints
  async login(request: LoginRequest): Promise<User> {
    return this.request<User>('/users/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async register(request: RegisterRequest): Promise<User> {
    return this.request<User>('/users/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async getTopPlayers(count: number = 10): Promise<User[]> {
    return this.request<User[]>(`/users/ranking?count=${count}`);
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request(`/users/${id}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getAchievements(userId: number): Promise<Achievement[]> {
    return this.request<Achievement[]>(`/users/${userId}/achievements`);
  }

  // Game endpoints
  async createGame(hostUserId: number, gameData: CreateGameRequest): Promise<Game> {
    return this.request<Game>(`/games?hostUserId=${hostUserId}`, {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async getGame(id: number): Promise<Game> {
    return this.request<Game>(`/games/${id}`);
  }

  async getAvailableGames(): Promise<Game[]> {
    return this.request<Game[]>('/games/available');
  }

  async joinGame(gameId: number, userId: number, token: string): Promise<Game> {
    return this.request<Game>(`/games/${gameId}/join?userId=${userId}&token=${token}`, {
      method: 'POST',
    });
  }

  async startGame(gameId: number): Promise<Game> {
    return this.request<Game>(`/games/${gameId}/start`, {
      method: 'POST',
    });
  }

  // Lobby endpoints
  async createLobby(hostUserId: number, maxPlayers: number): Promise<LobbyInfo> {
    return this.request<LobbyInfo>(`/lobby/create?hostUserId=${hostUserId}`, {
      method: 'POST',
      body: JSON.stringify({ maxPlayers }),
    });
  }

  async joinLobby(code: string, userId: number): Promise<LobbyInfo> {
    return this.request<LobbyInfo>(`/lobby/join?userId=${userId}`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getLobby(code: string): Promise<LobbyInfo> {
    return this.request<LobbyInfo>(`/lobby/${code}`);
  }

  async startLobby(code: string, hostUserId: number): Promise<LobbyInfo> {
    return this.request<LobbyInfo>(`/lobby/${code}/start?hostUserId=${hostUserId}`, {
      method: 'POST',
    });
  }

  async leaveLobby(code: string, userId: number): Promise<void> {
    return this.request<void>(`/lobby/${code}/leave?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async getPlayer(gameId: number, playerId: number): Promise<PlayerInGame> {
    return this.request<PlayerInGame>(`/games/${gameId}/players/${playerId}`);
  }

  // Board endpoints
  async getBoardSpaces(): Promise<BoardSpace[]> {
    return this.request<BoardSpace[]>('/board/spaces');
  }

  async getAllProperties(): Promise<Property[]> {
    return this.request<Property[]>('/board/properties');
  }

  async getPropertyByPosition(position: number): Promise<Property> {
    return this.request<Property>(`/board/properties/${position}`);
  }

  // Cards endpoints
  async drawCommunityCard(): Promise<Card> {
    const res = await this.request<CardDraw>('/cards/community/draw');
    return res.card;
  }

  async drawLuckCard(): Promise<Card> {
    const res = await this.request<CardDraw>('/cards/luck/draw');
    return res.card;
  }

  // Game actions
  async rollDice(): Promise<DiceRoll> {
    return this.request<DiceRoll>('/gameactions/roll-dice', {
      method: 'POST',
    });
  }

  async movePlayer(gameId: number, playerId: number, dice1?: number, dice2?: number): Promise<MoveResult> {
    let url = `/gameactions/move?gameId=${gameId}&playerId=${playerId}`;
    if (dice1 !== undefined && dice2 !== undefined) {
      url += `&dice1=${dice1}&dice2=${dice2}`;
    }
    return this.request<MoveResult>(url, {
      method: 'POST',
    });
  }

  async buyProperty(gameId: number, playerId: number, propertyId: number): Promise<{ message: string; moneyLeft: number }> {
    return this.request(`/gameactions/buy-property`, {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId, propertyId }),
    });
  }

  async buildUpgrade(gameId: number, playerId: number, propertyId: number): Promise<{ message: string; level: number; moneyLeft: number }> {
    return this.request(`/gameactions/build-upgrade`, {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId, propertyId }),
    });
  }

  async payRent(
    gameId: number,
    fromPlayerId: number,
    toPlayerId: number,
    amount: number,
    propertyId?: number,
    diceTotal?: number
  ): Promise<{ message: string; fromPlayerMoney: number; toPlayerMoney: number }> {
    const params = new URLSearchParams({
      fromPlayerId: String(fromPlayerId),
      toPlayerId: String(toPlayerId),
      amount: String(amount),
      gameId: String(gameId),
    });
    if (propertyId !== undefined) params.set("propertyId", String(propertyId));
    if (diceTotal !== undefined) params.set("diceTotal", String(diceTotal));

    return this.request(`/gameactions/pay-rent?${params.toString()}`, {
      method: 'POST',
    });
  }

  async getPropertyUpgrades(gameId: number): Promise<PropertyUpgradeInfo[]> {
    return this.request<PropertyUpgradeInfo[]>(`/gameactions/property-upgrades?gameId=${gameId}`);
  }

  async trade(request: TradeRequest): Promise<TradeResult> {
    return this.request<TradeResult>(`/gameactions/trade`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async mortgageProperty(gameId: number, playerId: number, propertyId: number): Promise<{ message: string; moneyLeft: number }> {
    return this.request(`/gameactions/mortgage`, {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId, propertyId }),
    });
  }

  async unmortgageProperty(gameId: number, playerId: number, propertyId: number): Promise<{ message: string; moneyLeft: number }> {
    return this.request(`/gameactions/unmortgage`, {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId, propertyId }),
    });
  }

  async endGame(gameId: number, winnerId?: number) {
    let url = `/gameactions/end-game?gameId=${gameId}`;
    if (winnerId) url += `&winnerId=${winnerId}`;
    return this.request(url, {
      method: "POST"
    });
  }

  // Shop endpoints
  async getShopProducts(): Promise<ShopProduct[]> {
    return this.request<ShopProduct[]>('/shop/products');
  }

  async getInventory(userId: number): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(`/shop/inventory/${userId}`);
  }

  // Events endpoints
  async getDailyRewards(userId: number): Promise<DailyReward[]> {
    return this.request<DailyReward[]>(`/events/daily?userId=${userId}`);
  }

  async claimReward(recompensaId: number, userId: number): Promise<{ message: string; newBalance: number }> {
    return this.request(`/events/claim/${recompensaId}?userId=${userId}`, {
      method: 'POST',
    });
  }

  // Admin endpoints
  async getAdminUsers(adminUserId: number): Promise<unknown[]> {
    return this.request(`/admin/users?adminUserId=${adminUserId}`);
  }

  async banUser(userId: number, adminUserId: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${userId}/ban?adminUserId=${adminUserId}`, { method: 'PUT' });
  }

  async unbanUser(userId: number, adminUserId: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${userId}/unban?adminUserId=${adminUserId}`, { method: 'PUT' });
  }

  async makeAdmin(userId: number, adminUserId: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${userId}/make-admin?adminUserId=${adminUserId}`, { method: 'PUT' });
  }

  async resetElo(userId: number, adminUserId: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${userId}/reset-elo?adminUserId=${adminUserId}`, { method: 'PUT' });
  }

  async getAdminStats(adminUserId: number): Promise<{ totalUsers: number; activeUsers: number; totalGames: number; activeGames: number; bannedUsers: number }> {
    return this.request(`/admin/stats?adminUserId=${adminUserId}`);
  }
}

export const apiService = new ApiService();
