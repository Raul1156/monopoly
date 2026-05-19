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

        if (!user.Activo)
            throw new Exception("Tu cuenta ha sido suspendida");

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
            TiempoJugadoMinutos = 0,
            RachaActual = 0,
            MejorRacha = 0,
            EsAdmin = false,
            TwoFactorEnabled = false,
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
        var query = _mySql.Usuarios
            .AsNoTracking()
            .Where(u => u.Activo)
            .OrderByDescending(u => u.Elo);

        var users = count > 0 
            ? await query.Take(count).ToListAsync() 
            : await query.ToListAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> UpdateUser(int id, UserDto userDto)
    {
        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
            throw new Exception("User not found");

        // Update avatar if provided
        if (!string.IsNullOrWhiteSpace(userDto.Avatar))
            user.Avatar = userDto.Avatar;

        // Update username if provided and different
        if (!string.IsNullOrWhiteSpace(userDto.Username) && userDto.Username != user.Username)
        {
            var exists = await _mySql.Usuarios.AnyAsync(u => u.Username == userDto.Username && u.Id != id);
            if (exists) throw new Exception("El nombre de usuario ya está en uso");
            user.Username = userDto.Username;
        }

        // Update email if provided and different
        if (!string.IsNullOrWhiteSpace(userDto.Email) && userDto.Email != user.Email)
        {
            var exists = await _mySql.Usuarios.AnyAsync(u => u.Email == userDto.Email && u.Id != id);
            if (exists) throw new Exception("El email ya está en uso");
            user.Email = userDto.Email;
        }

        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task ChangePassword(int id, string currentPassword, string newPassword)
    {
        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
            throw new Exception("User not found");

        var stored = user.PasswordHash ?? string.Empty;
        bool isValid;
        try
        {
            isValid = stored.StartsWith("$2", StringComparison.Ordinal)
                ? BCrypt.Net.BCrypt.Verify(currentPassword, stored)
                : currentPassword == stored;
        }
        catch
        {
            throw new Exception("Error al verificar la contraseña actual");
        }

        if (!isValid)
            throw new Exception("La contraseña actual es incorrecta");

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
            throw new Exception("La nueva contraseña debe tener al menos 8 caracteres");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();
    }

    private static UserDto MapToDto(UsuarioEntity user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Avatar = NormalizeAvatar(user.Avatar, user.Username),
            GamesPlayed = user.PartidasJugadas,
            GamesWon = user.PartidasGanadas,
            TotalMoney = user.MonedaLobby,
            TimePlayedHours = Math.Round(user.TiempoJugadoMinutos / 60.0, 1),
            Elo = user.Elo,
            CurrentStreak = user.RachaActual,
            BestStreak = user.MejorRacha,
            IsAdmin = user.EsAdmin
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
