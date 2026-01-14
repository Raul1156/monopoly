namespace MonopolyAPI.Models;

public class BoardSpace
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Position { get; set; }
    public SpaceType Type { get; set; }
    public int? PropertyId { get; set; }
    public Property? Property { get; set; }
    public int? ActionAmount { get; set; } // For tax, GO money, etc.
}

public enum SpaceType
{
    Go,
    Property,
    Tax,
    Chance,
    CommunityChest,
    Jail,
    GoToJail,
    FreeParking,
    Luxury
}
