namespace MonopolyAPI.Models;

public class PlayerInGame
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public Game? Game { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int Money { get; set; } = 1500;
    public int Position { get; set; } = 0;
    public bool IsInJail { get; set; } = false;
    public int JailTurns { get; set; } = 0;
    public bool IsBankrupt { get; set; } = false;
    public int TurnOrder { get; set; }
    public string Token { get; set; } = string.Empty;

    // Navigation properties
    public List<PropertyOwnership> OwnedProperties { get; set; } = new();
}
