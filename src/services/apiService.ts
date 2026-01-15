// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types matching backend DTOs
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  level: string;
  gamesPlayed: number;
  gamesWon: number;
  totalMoney: number;
  gems: number;
  timePlayedHours: number;
  elo: number;
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
  isBankrupt: boolean;
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

export interface Property {
  id: number;
  name: string;
  type: string;
  price: number;
  rentBase: number;
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

export interface ShopProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: 'pts' | 'gems';
  category: 'avatar' | 'theme';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
}

export interface InventoryItem {
  productId: number;
  name: string;
  description: string;
  category: 'avatars' | 'themes';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
  equipped: boolean;
  quantity: number;
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

  async payRent(fromPlayerId: number, toPlayerId: number, amount: number): Promise<{ message: string; fromPlayerMoney: number; toPlayerMoney: number }> {
    return this.request(`/gameactions/pay-rent?fromPlayerId=${fromPlayerId}&toPlayerId=${toPlayerId}&amount=${amount}`, {
      method: 'POST',
    });
  }

  // Shop endpoints
  async getShopProducts(): Promise<ShopProduct[]> {
    return this.request<ShopProduct[]>('/shop/products');
  }

  async getInventory(userId: number): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(`/shop/inventory/${userId}`);
  }
}

export const apiService = new ApiService();
