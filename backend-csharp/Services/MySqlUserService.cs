using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using MonopolyAPI.Data;
using MonopolyAPI.Data.MySqlEntities;
using MonopolyAPI.DTOs;

namespace MonopolyAPI.Services;

public class MySqlUserService : IUserService
{
    private readonly MonopolyMySqlDbContext _mySql;
    private readonly IHostEnvironment _env;

    public MySqlUserService(MonopolyMySqlDbContext mySql, IHostEnvironment env)
    {
        _mySql = mySql;
        _env = env;
    }

    public async Task<UserDto?> Login(LoginRequestDto request)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        var email = request.Email?.Trim() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(username) && string.IsNullOrWhiteSpace(email))
            throw new Exception("Username or email is required");

        if (string.IsNullOrWhiteSpace(password))
            throw new Exception("Password is required");

        var user = await _mySql.Usuarios
            .FirstOrDefaultAsync(u => (!string.IsNullOrWhiteSpace(username) && u.Username == username)
                                   || (!string.IsNullOrWhiteSpace(email) && u.Email == email));

        if (user == null)
            return null;

        var stored = user.PasswordHash ?? string.Empty;
        if (string.IsNullOrWhiteSpace(stored))
            return null;

        var isBcrypt = stored.StartsWith("$2", StringComparison.Ordinal);
        bool isValid;
        try
        {
            isValid = isBcrypt
                ? BCrypt.Net.BCrypt.Verify(password, stored)
                : password == stored;
        }
        catch
        {
            // If the hash format is invalid, treat it as invalid credentials.
            return null;
        }

        if (!isValid)
            return null;

        // One-time migration path: if the DB contains legacy plaintext passwords, upgrade them to bcrypt.
        if (!isBcrypt)
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);

        user.UltimoLogin = DateTime.UtcNow;
        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<UserDto> Register(RegisterRequestDto request)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        var email = request.Email?.Trim() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(username))
            throw new Exception("Username is required");
        if (string.IsNullOrWhiteSpace(email))
            throw new Exception("Email is required");
        if (string.IsNullOrWhiteSpace(password))
            throw new Exception("Password is required");

        var exists = await _mySql.Usuarios.AnyAsync(u => u.Username == username || u.Email == email);
        if (exists)
            throw new Exception("Username or email already exists");

        var user = new UsuarioEntity
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Avatar = "default",
            Color = "bg-red-500",
            Elo = 1000,
            MonedaLobby = 0,
            Gemas = 0,
            Nivel = 1,
            Experiencia = 0,
            PartidasJugadas = 0,
            PartidasGanadas = 0,
            Activo = true,
            UltimoLogin = DateTime.UtcNow,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        _mySql.Usuarios.Add(user);
        await _mySql.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<UserDto?> GetUserById(int id)
    {
        var user = await _mySql.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<List<UserDto>> GetTopPlayers(int count = 10)
    {
        var users = await _mySql.Usuarios
            .AsNoTracking()
            .Where(u => u.Activo)
            .OrderByDescending(u => u.Elo)
            .Take(count)
            .ToListAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> UpdateUser(int id, UserDto userDto)
    {
        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
            throw new Exception("User not found");

        if (!string.IsNullOrWhiteSpace(userDto.Avatar))
            user.Avatar = userDto.Avatar;

        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();

        return MapToDto(user);
    }

    private static UserDto MapToDto(UsuarioEntity user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Avatar = NormalizeAvatar(user.Avatar, user.Username),
            Level = $"Nivel {user.Nivel}",
            GamesPlayed = user.PartidasJugadas,
            GamesWon = user.PartidasGanadas,
            TotalMoney = user.MonedaLobby,
            Gems = user.Gemas,
            TimePlayedHours = 0,
            Elo = user.Elo
        };
    }

    private static string NormalizeAvatar(string? avatar, string username)
    {
        if (string.IsNullOrWhiteSpace(avatar) || avatar == "default")
            return $"https://api.dicebear.com/7.x/avataaars/svg?seed={Uri.EscapeDataString(username)}";

        // If the DB stores a relative avatar name, keep behavior simple: return it as-is.
        return avatar;
    }
}
