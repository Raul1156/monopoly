namespace MonopolyAPI.Models;

public class Game
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int HostUserId { get; set; }
    public User? Host { get; set; }
    public GameStatus Status { get; set; } = GameStatus.Waiting;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int CurrentTurn { get; set; } = 0;
    public int MaxPlayers { get; set; } = 4;
    public int? WinnerUserId { get; set; }

    // Navigation properties
    public List<PlayerInGame> Players { get; set; } = new();
}

public enum GameStatus
{
    Waiting,
    InProgress,
    Finished,
    Cancelled
}
