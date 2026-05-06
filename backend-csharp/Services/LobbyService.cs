using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.Data.MySqlEntities;
using MonopolyAPI.Models;

namespace MonopolyAPI.Services;

public interface ILobbyService
{
    Task<LobbyDto> CreateGame(int hostUserId, int maxPlayers);
    Task<LobbyDto> JoinGameByCode(string code, int userId);
    Task<LobbyDto?> GetGameByCode(string code);
    Task<LobbyDto> StartGame(string code, int hostUserId);
    Task LeaveGame(string code, int userId);
}

public class LobbyDto
{
    public int GameId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int MaxPlayers { get; set; }
    public int HostUserId { get; set; }
    public List<LobbyPlayerDto> Players { get; set; } = new();
}

public class LobbyPlayerDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsHost { get; set; }
}

public class LobbyService : ILobbyService
{
    private readonly MonopolyMySqlDbContext _mySql;
    private readonly MonopolyDbContext _inMemory;
    private static readonly Random _random = new();

    private static readonly string[] PlayerColors = { "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500" };

    public LobbyService(MonopolyMySqlDbContext mySql, MonopolyDbContext inMemory)
    {
        _mySql = mySql;
        _inMemory = inMemory;
    }

    public async Task<LobbyDto> CreateGame(int hostUserId, int maxPlayers)
    {
        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == hostUserId);
        if (user == null)
            throw new Exception("Usuario no encontrado");

        maxPlayers = Math.Clamp(maxPlayers, 2, 4);

        var code = GenerateCode();

        // Ensure unique code
        while (await _mySql.Partidas.AnyAsync(p => p.CodigoPartida == code))
        {
            code = GenerateCode();
        }

        var partida = new PartidaEntity
        {
            CodigoPartida = code,
            Estado = "esperando",
            MaxJugadores = maxPlayers,
            FechaInicio = DateTime.UtcNow
        };

        _mySql.Partidas.Add(partida);
        await _mySql.SaveChangesAsync();

        var partidaUsuario = new PartidaUsuarioEntity
        {
            PartidaId = partida.Id,
            UsuarioId = hostUserId,
            OrdenJuego = 0,
            DineroActual = 1500,
            PosicionActual = 0,
            TurnosCarcel = 0,
            Activo = true
        };

        _mySql.PartidasUsuarios.Add(partidaUsuario);
        await _mySql.SaveChangesAsync();

        return await BuildLobbyDto(partida.Id);
    }

    public async Task<LobbyDto> JoinGameByCode(string code, int userId)
    {
        var partida = await _mySql.Partidas
            .Include(p => p.Jugadores)
            .FirstOrDefaultAsync(p => p.CodigoPartida == code.ToUpper());

        if (partida == null)
            throw new Exception("Partida no encontrada");

        if (partida.Estado != "esperando")
            throw new Exception("La partida ya ha empezado");

        if (partida.Jugadores.Count >= partida.MaxJugadores)
            throw new Exception("La partida está llena");

        if (partida.Jugadores.Any(j => j.UsuarioId == userId))
            throw new Exception("Ya estás en esta partida");

        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            throw new Exception("Usuario no encontrado");

        var partidaUsuario = new PartidaUsuarioEntity
        {
            PartidaId = partida.Id,
            UsuarioId = userId,
            OrdenJuego = partida.Jugadores.Count,
            DineroActual = 1500,
            PosicionActual = 0,
            TurnosCarcel = 0,
            Activo = true
        };

        _mySql.PartidasUsuarios.Add(partidaUsuario);
        await _mySql.SaveChangesAsync();

        return await BuildLobbyDto(partida.Id);
    }

    public async Task<LobbyDto?> GetGameByCode(string code)
    {
        var partida = await _mySql.Partidas
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.CodigoPartida == code.ToUpper());

        if (partida == null) return null;
        return await BuildLobbyDto(partida.Id);
    }

    public async Task<LobbyDto> StartGame(string code, int hostUserId)
    {
        var partida = await _mySql.Partidas
            .Include(p => p.Jugadores)
            .FirstOrDefaultAsync(p => p.CodigoPartida == code.ToUpper());

        if (partida == null)
            throw new Exception("Partida no encontrada");

        // Verify host is the first player (order 0)
        var host = partida.Jugadores.FirstOrDefault(j => j.OrdenJuego == 0);
        if (host == null || host.UsuarioId != hostUserId)
            throw new Exception("Solo el host puede iniciar la partida");

        if (partida.Estado != "esperando")
            throw new Exception("La partida ya ha empezado");

        if (partida.Jugadores.Count < 2)
            throw new Exception("Se necesitan al menos 2 jugadores");

        partida.Estado = "en_curso";
        partida.JugadorTurnoId = host.UsuarioId;
        await _mySql.SaveChangesAsync();

        // Sync to InMemory DB for game engine
        await SyncToInMemory(partida);

        return await BuildLobbyDto(partida.Id);
    }

    public async Task LeaveGame(string code, int userId)
    {
        var partida = await _mySql.Partidas
            .Include(p => p.Jugadores)
            .FirstOrDefaultAsync(p => p.CodigoPartida == code.ToUpper());

        if (partida == null)
            throw new Exception("Partida no encontrada");

        if (partida.Estado != "esperando")
            throw new Exception("No se puede abandonar una partida en curso");

        var jugador = partida.Jugadores.FirstOrDefault(j => j.UsuarioId == userId);
        if (jugador == null)
            throw new Exception("No estás en esta partida");

        _mySql.PartidasUsuarios.Remove(jugador);

        // If host leaves (order 0), cancel game
        if (jugador.OrdenJuego == 0)
        {
            partida.Estado = "cancelada";
        }
        else
        {
            // Reorder remaining players
            var remaining = partida.Jugadores.Where(j => j.UsuarioId != userId).OrderBy(j => j.OrdenJuego).ToList();
            for (int i = 0; i < remaining.Count; i++)
            {
                remaining[i].OrdenJuego = i;
            }
        }

        await _mySql.SaveChangesAsync();
    }

    private async Task SyncToInMemory(PartidaEntity partida)
    {
        // Create InMemory Game
        var existing = await _inMemory.Games.FirstOrDefaultAsync(g => g.Id == partida.Id);
        if (existing != null) return; // Already synced

        var game = new Game
        {
            Id = partida.Id,
            Name = $"Partida {partida.CodigoPartida}",
            HostUserId = partida.Jugadores.FirstOrDefault(j => j.OrdenJuego == 0)?.UsuarioId ?? 0,
            MaxPlayers = partida.MaxJugadores,
            Status = GameStatus.InProgress,
            CreatedAt = partida.FechaInicio,
            StartedAt = DateTime.UtcNow,
            CurrentTurn = 0
        };

        _inMemory.Games.Add(game);
        await _inMemory.SaveChangesAsync();

        foreach (var jugador in partida.Jugadores.OrderBy(j => j.OrdenJuego))
        {
            // Ensure user exists in InMemory
            var inMemUser = await _inMemory.Users.FirstOrDefaultAsync(u => u.Id == jugador.UsuarioId);
            if (inMemUser == null)
            {
                var mysqlUser = await _mySql.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == jugador.UsuarioId);
                if (mysqlUser != null)
                {
                    inMemUser = new User
                    {
                        Id = mysqlUser.Id,
                        Username = mysqlUser.Username,
                        Email = mysqlUser.Email,
                        PasswordHash = "",
                        Avatar = mysqlUser.Avatar ?? "default",
                        Level = $"Nivel {mysqlUser.Nivel}",
                        Elo = mysqlUser.Elo,
                        GamesPlayed = mysqlUser.PartidasJugadas,
                        GamesWon = mysqlUser.PartidasGanadas,
                        TotalMoney = mysqlUser.MonedaLobby
                    };
                    _inMemory.Users.Add(inMemUser);
                }
            }

            var color = PlayerColors[jugador.OrdenJuego % PlayerColors.Length];
            var playerInGame = new PlayerInGame
            {
                GameId = game.Id,
                UserId = jugador.UsuarioId,
                Money = 1500,
                Position = 0,
                TurnOrder = jugador.OrdenJuego,
                Token = color
            };

            _inMemory.PlayersInGame.Add(playerInGame);
        }

        await _inMemory.SaveChangesAsync();
    }

    private async Task<LobbyDto> BuildLobbyDto(int partidaId)
    {
        var partida = await _mySql.Partidas
            .AsNoTracking()
            .Include(p => p.Jugadores)
                .ThenInclude(j => j.Usuario)
            .FirstOrDefaultAsync(p => p.Id == partidaId);

        if (partida == null) throw new Exception("Partida no encontrada");

        var hostUserId = partida.Jugadores
            .OrderBy(j => j.OrdenJuego)
            .FirstOrDefault()?.UsuarioId ?? 0;

        return new LobbyDto
        {
            GameId = partida.Id,
            Code = partida.CodigoPartida ?? "",
            Status = partida.Estado,
            MaxPlayers = partida.MaxJugadores,
            HostUserId = hostUserId,
            Players = partida.Jugadores
                .OrderBy(j => j.OrdenJuego)
                .Select(j => new LobbyPlayerDto
                {
                    UserId = j.UsuarioId,
                    Username = j.Usuario?.Username ?? "Unknown",
                    Avatar = NormalizeAvatar(j.Usuario?.Avatar, j.Usuario?.Username ?? ""),
                    Color = PlayerColors[j.OrdenJuego % PlayerColors.Length],
                    Order = j.OrdenJuego,
                    IsHost = j.OrdenJuego == 0
                })
                .ToList()
        };
    }

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 6).Select(_ => chars[_random.Next(chars.Length)]).ToArray());
    }

    private static string NormalizeAvatar(string? avatar, string username)
    {
        if (string.IsNullOrWhiteSpace(avatar) || avatar == "default")
            return $"https://api.dicebear.com/7.x/avataaars/svg?seed={Uri.EscapeDataString(username)}";
        return avatar;
    }
}
