using MonopolyAPI.Data;
using MonopolyAPI.Models;
using MonopolyAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MonopolyAPI.Services;

public interface IUserService
{
    Task<UserDto?> Login(LoginRequestDto request);
    Task<UserDto> Register(RegisterRequestDto request);
    Task<UserDto?> GetUserById(int id);
    Task<List<UserDto>> GetTopPlayers(int count = 10);
    Task<UserDto> UpdateUser(int id, UserDto userDto);
}

public class UserService : IUserService
{
    private readonly MonopolyDbContext _context;

    public UserService(MonopolyDbContext context)
    {
        _context = context;
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

        var user = await _context.Users
            .FirstOrDefaultAsync(u => (!string.IsNullOrWhiteSpace(username) && u.Username == username)
                                   || (!string.IsNullOrWhiteSpace(email) && u.Email == email));

        if (user == null)
            return null;

        try
        {
            if (string.IsNullOrWhiteSpace(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;
        }
        catch
        {
            return null;
        }

        user.LastLogin = DateTime.UtcNow;
        await _context.SaveChangesAsync();

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

        var exists = await _context.Users.AnyAsync(u => u.Username == username || u.Email == email);
        if (exists)
            throw new Exception("Username or email already exists");

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username,
            Level = "Novato",
            TotalMoney = 1500,
            Elo = 1000,
            CreatedAt = DateTime.UtcNow,
            LastLogin = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<UserDto?> GetUserById(int id)
    {
        var user = await _context.Users.FindAsync(id);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<List<UserDto>> GetTopPlayers(int count = 10)
    {
        var users = await _context.Users
            .OrderByDescending(u => u.Elo)
            .Take(count)
            .ToListAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> UpdateUser(int id, UserDto userDto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            throw new Exception("User not found");

        user.Avatar = userDto.Avatar;
        user.Level = userDto.Level;
        await _context.SaveChangesAsync();

        return MapToDto(user);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Avatar = user.Avatar,
            Level = user.Level,
            GamesPlayed = user.GamesPlayed,
            GamesWon = user.GamesWon,
            TotalMoney = user.TotalMoney,
            TimePlayedHours = user.TimePlayedHours,
            Elo = user.Elo
        };
    }
}
