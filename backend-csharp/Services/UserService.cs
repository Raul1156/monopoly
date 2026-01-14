using MonopolyAPI.Data;
using MonopolyAPI.Models;
using MonopolyAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MonopolyAPI.Services;

public interface IUserService
{
    Task<UserDto?> Login(LoginRequestDto request);
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
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);

        if (user == null)
        {
            // Create new user
            user = new User
            {
                Username = request.Username,
                Email = request.Email,
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.Username,
                Level = "Novato",
                TotalMoney = 1500,
                Elo = 1000
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else
        {
            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

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
