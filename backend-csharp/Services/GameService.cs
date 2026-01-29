using MonopolyAPI.Data;
using MonopolyAPI.Models;
using MonopolyAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MonopolyAPI.Services;

public interface IGameService
{
    Task<GameDto> CreateGame(int hostUserId, CreateGameDto createGameDto);
    Task<GameDto?> GetGame(int gameId);
    Task<List<GameDto>> GetAvailableGames();
    Task<GameDto> JoinGame(int gameId, int userId, string token);
    Task<GameDto> StartGame(int gameId);
    Task<PlayerInGameDto?> GetPlayerInGame(int gameId, int playerId);
    Task<PlayerInGameDto?> GetNextActivePlayers(int gameId, int currentTurnOrder);
    Task<bool> CheckAndEliminateInactivePlayers(int gameId);
}

public class GameService : IGameService
{
    private readonly MonopolyDbContext _context;

    public GameService(MonopolyDbContext context)
    {
        _context = context;
    }

    public async Task<GameDto> CreateGame(int hostUserId, CreateGameDto createGameDto)
    {
        var game = new Game
        {
            Name = createGameDto.Name,
            HostUserId = hostUserId,
            MaxPlayers = createGameDto.MaxPlayers,
            Status = GameStatus.Waiting,
            CreatedAt = DateTime.UtcNow
        };

        _context.Games.Add(game);
        await _context.SaveChangesAsync();

        // Add host as first player
        var hostPlayer = new PlayerInGame
        {
            GameId = game.Id,
            UserId = hostUserId,
            Money = 1500,
            Position = 0,
            TurnOrder = 0,
            Token = "car"
        };

        _context.PlayersInGame.Add(hostPlayer);
        await _context.SaveChangesAsync();

        return await GetGameDto(game.Id);
    }

    public async Task<GameDto?> GetGame(int gameId)
    {
        return await GetGameDto(gameId);
    }

    public async Task<List<GameDto>> GetAvailableGames()
    {
        var games = await _context.Games
            .Where(g => g.Status == GameStatus.Waiting)
            .Include(g => g.Players)
                .ThenInclude(p => p.User)
            .ToListAsync();

        return games.Select(MapToGameDto).ToList();
    }

    public async Task<GameDto> JoinGame(int gameId, int userId, string token)
    {
        var game = await _context.Games
            .Include(g => g.Players)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null)
            throw new Exception("Game not found");

        if (game.Status != GameStatus.Waiting)
            throw new Exception("Game already started");

        if (game.Players.Count >= game.MaxPlayers)
            throw new Exception("Game is full");

        if (game.Players.Any(p => p.UserId == userId))
            throw new Exception("Player already in game");

        var player = new PlayerInGame
        {
            GameId = gameId,
            UserId = userId,
            Money = 1500,
            Position = 0,
            TurnOrder = game.Players.Count,
            Token = token
        };

        _context.PlayersInGame.Add(player);
        await _context.SaveChangesAsync();

        return await GetGameDto(gameId);
    }

    public async Task<GameDto> StartGame(int gameId)
    {
        var game = await _context.Games
            .Include(g => g.Players)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null)
            throw new Exception("Game not found");

        if (game.Status != GameStatus.Waiting)
            throw new Exception("Game already started");

        if (game.Players.Count < 2)
            throw new Exception("Need at least 2 players to start");

        game.Status = GameStatus.InProgress;
        game.StartedAt = DateTime.UtcNow;
        game.CurrentTurn = 0;

        await _context.SaveChangesAsync();

        return await GetGameDto(gameId);
    }

    public async Task<PlayerInGameDto?> GetPlayerInGame(int gameId, int playerId)
    {
        var player = await _context.PlayersInGame
            .Include(p => p.User)
            .Include(p => p.OwnedProperties)
                .ThenInclude(po => po.Property)
            .FirstOrDefaultAsync(p => p.GameId == gameId && p.Id == playerId);

        return player != null ? MapToPlayerDto(player) : null;
    }

    private async Task<GameDto> GetGameDto(int gameId)
    {
        var game = await _context.Games
            .Include(g => g.Players)
                .ThenInclude(p => p.User)
            .Include(g => g.Players)
                .ThenInclude(p => p.OwnedProperties)
                    .ThenInclude(po => po.Property)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null)
            throw new Exception("Game not found");

        return MapToGameDto(game);
    }

    private static GameDto MapToGameDto(Game game)
    {
        return new GameDto
        {
            Id = game.Id,
            Name = game.Name,
            Status = game.Status.ToString(),
            CurrentTurn = game.CurrentTurn,
            Players = game.Players.Select(MapToPlayerDto).ToList()
        };
    }

    private static PlayerInGameDto MapToPlayerDto(PlayerInGame player)
    {
        return new PlayerInGameDto
        {
            Id = player.Id,
            UserId = player.UserId,
            Username = player.User?.Username ?? "Unknown",
            Money = player.Money,
            Position = player.Position,
            IsInJail = player.IsInJail,
            IsBankrupt = player.IsBankrupt,
            Token = player.Token,
            OwnedProperties = player.OwnedProperties.Select(po => new PropertyOwnershipDto
            {
                PropertyId = po.PropertyId,
                PropertyName = po.Property?.Name ?? "Unknown",
                Houses = po.Houses,
                HasHotel = po.HasHotel,
                IsMortgaged = po.IsMortgaged
            }).ToList()
        };
    }

    public async Task<PlayerInGameDto?> GetNextActivePlayers(int gameId, int currentTurnOrder)
    {
        var game = await _context.Games
            .Include(g => g.Players)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null)
            return null;

        var activePlayers = game.Players
            .Where(p => !p.IsBankrupt)
            .OrderBy(p => p.TurnOrder)
            .ToList();

        if (activePlayers.Count == 0)
            return null;

        // Find the next active player after the current turn order
        var nextPlayer = activePlayers.FirstOrDefault(p => p.TurnOrder > currentTurnOrder);
        
        // If no player found with higher turn order, start from the beginning
        if (nextPlayer == null)
            nextPlayer = activePlayers.First();

        var nextPlayerFull = await _context.PlayersInGame
            .Include(p => p.User)
            .Include(p => p.OwnedProperties)
                .ThenInclude(po => po.Property)
            .FirstOrDefaultAsync(p => p.Id == nextPlayer.Id);

        return nextPlayerFull != null ? MapToPlayerDto(nextPlayerFull) : null;
    }

    public async Task<bool> CheckAndEliminateInactivePlayers(int gameId)
    {
        var game = await _context.Games
            .Include(g => g.Players)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null)
            return false;

        var inactivePlayers = game.Players
            .Where(p => p.Money <= 0 && !p.IsBankrupt)
            .ToList();

        if (inactivePlayers.Count == 0)
            return false;

        foreach (var player in inactivePlayers)
        {
            player.IsBankrupt = true;
        }

        await _context.SaveChangesAsync();
        return true;
    }

}
