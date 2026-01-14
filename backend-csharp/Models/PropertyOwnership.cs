namespace MonopolyAPI.Models;

public class PropertyOwnership
{
    public int Id { get; set; }
    public int PlayerInGameId { get; set; }
    public PlayerInGame? PlayerInGame { get; set; }
    public int PropertyId { get; set; }
    public Property? Property { get; set; }
    public int Houses { get; set; } = 0;
    public bool HasHotel { get; set; } = false;
    public bool IsMortgaged { get; set; } = false;
    public DateTime AcquiredAt { get; set; } = DateTime.UtcNow;
}
