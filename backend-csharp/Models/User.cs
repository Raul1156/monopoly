namespace MonopolyAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Level { get; set; } = "Novato";
    public int GamesPlayed { get; set; } = 0;
    public int GamesWon { get; set; } = 0;
    public int TotalMoney { get; set; } = 1500;
    public double TimePlayedHours { get; set; } = 0;
    public int Elo { get; set; } = 1000;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastLogin { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public List<Game> GamesAsHost { get; set; } = new();
    public List<PlayerInGame> PlayerGames { get; set; } = new();
}
